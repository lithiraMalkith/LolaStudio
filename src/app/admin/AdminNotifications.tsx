'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Package, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchDashboardStats, fetchOrders } from '@/lib/admin-client'
import { PERMISSIONS } from '@/lib/permissions'
import { formatPrice, cn } from '@/lib/utils'
import type { DashboardStats, Order, ActivityItem } from '@/types'

// Simple notification beep using Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // A6
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  } catch (e) {
    console.error('AudioContext error:', e)
  }
}

export default function AdminNotifications() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  
  const [isOpen, setIsOpen] = useState(false)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const seenActivitiesRef = useRef<Set<string>>(new Set())
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Only run if user has orders:read permission
    if (!user || !hasPermission(PERMISSIONS.ORDERS_READ)) return

    let isInitialFetch = true

    const loadData = async () => {
      try {
        const token = await user.getIdToken()
        
        // Fetch dashboard stats (for activities and pending order count)
        // and fetch the 10 most recent pending orders for the dropdown
        const [statsData, ordersData] = await Promise.all([
          fetchDashboardStats(token),
          fetchOrders(token, { limit: '10', status: 'pending' })
        ])

        setPendingOrdersCount(statsData.pendingOrders || 0)
        setPendingOrders(ordersData)

        // Process recent activities for toasts
        const newActivities = statsData.recentActivities || []
        const currentSeen = seenActivitiesRef.current
        let hasNewActivity = false

        newActivities.forEach((activity: ActivityItem) => {
          if (!currentSeen.has(activity.id)) {
            currentSeen.add(activity.id)
            
            // Only toast if it's NOT the initial fetch (so we don't spam toasts on page load)
            if (!isInitialFetch) {
              hasNewActivity = true
              
              // Use appropriate toast styling based on activity type
              if (activity.type === 'order') {
                toast.success(activity.message, { icon: '🛒' })
              } else if (activity.type === 'user') {
                toast(activity.message, { icon: '👤' })
              } else {
                toast(activity.message, { icon: '📦' })
              }
            }
          }
        })

        if (hasNewActivity) {
          playNotificationSound()
        }
        
        isInitialFetch = false

      } catch (error) {
        console.error('Failed to fetch notification data:', error)
      }
    }

    // Initial load
    loadData()

    // Poll every 30 seconds
    const intervalId = setInterval(loadData, 30000)

    return () => clearInterval(intervalId)
  }, [user, hasPermission]) // Only re-run if user/permissions change

  if (!user || !hasPermission(PERMISSIONS.ORDERS_READ)) {
    return null
  }

  const handleOrderClick = (orderRef: string) => {
    setIsOpen(false)
    router.push(`/admin/orders?search=${orderRef}`)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-brand-muted hover:text-brand-text hover:bg-brand-surface rounded-full transition-colors flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {pendingOrdersCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-danger rounded-full min-w-[18px]">
            {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-brand-surface border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3 border-b border-brand-border bg-brand-bg/50 backdrop-blur-sm flex justify-between items-center">
            <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-gold" />
              Pending Orders
            </h3>
            <span className="text-xs bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full font-medium">
              {pendingOrdersCount} Total
            </span>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-brand-muted text-sm flex flex-col items-center gap-2">
                <Package className="w-8 h-8 opacity-20" />
                <p>No pending orders</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/50">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order.orderRef)}
                    className="p-4 hover:bg-brand-gold/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-sm font-medium text-brand-gold group-hover:text-brand-gold-hover transition-colors">
                        #{order.orderRef}
                      </span>
                      <span className="text-xs font-semibold text-brand-text">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-brand-text truncate pr-4">
                        {order.customer?.name || 'Unknown Customer'}
                      </p>
                      <span className="text-[10px] text-brand-muted whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-brand-border bg-brand-bg/50">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/admin/orders')
              }}
              className="w-full py-2 text-xs font-medium text-brand-gold hover:text-brand-gold-hover text-center transition-colors rounded-lg hover:bg-brand-gold/10"
            >
              View All Orders
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

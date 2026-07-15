'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { cn, formatPrice } from '@/lib/utils'
import { fetchOrder, updateOrderStatus } from '@/lib/admin-client'
import { ArrowLeft, Clock, Package, Truck, CheckCircle, XCircle, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', class: 'status-pending', icon: <Clock className="w-4 h-4" /> },
  processing: { label: 'Processing', class: 'status-processing', icon: <Package className="w-4 h-4" /> },
  dispatched: { label: 'Dispatched', class: 'status-dispatched', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Delivered', class: 'status-delivered', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: <XCircle className="w-4 h-4" /> },
}

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'dispatched', 'delivered', 'cancelled'],
  processing: ['dispatched', 'delivered', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export default function ViewOrderPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  const orderId = params.id as string

  useGSAP(() => {
    const sections = document.querySelectorAll('.form-section')
    if (sections.length > 0) {
      gsap.from('.form-section', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
    }
  }, { scope: containerRef, dependencies: [loading] })

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  useEffect(() => {
    const loadOrder = async () => {
      if (!user || !orderId) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const data = await fetchOrder(token, orderId)
        // Convert string dates to Date objects if necessary
        const processedData = {
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        }
        setOrder(processedData)
      } catch (error: any) {
        console.error('Failed to load order:', error)
        addToast('error', error.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [user, orderId])

  const handleUpdateStatus = async () => {
    if (!user || !order || !selectedStatus) return

    if (selectedStatus === 'cancelled' && !cancellationReason.trim()) {
      addToast('error', 'Please provide a cancellation reason')
      return
    }

    setUpdating(true)
    try {
      const token = await user.getIdToken()
      await updateOrderStatus(token, order.id, {
        status: selectedStatus,
        cancellationReason: selectedStatus === 'cancelled' ? cancellationReason : undefined
      })
      
      setOrder((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          status: selectedStatus,
        }
      })
      
      addToast('success', 'Order status updated successfully')
      setSelectedStatus('')
      setCancellationReason('')
    } catch (error: any) {
      console.error('Failed to update status:', error)
      addToast('error', error.message || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-brand-danger" />
        <div>
          <h2 className="text-xl font-semibold text-brand-text">Order Not Found</h2>
          <p className="text-brand-muted mt-1">The order you are looking for doesn't exist.</p>
        </div>
        <button
          onClick={() => router.push('/admin/orders')}
          className="px-4 py-2 bg-brand-surface border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-hover transition-colors"
        >
          Back to Orders
        </button>
      </div>
    )
  }

  const nextStatuses = STATUS_TRANSITIONS[order.status] || []

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/orders')} className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-brand-text">Order {order.orderRef}</h1>
              <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[order.status]?.class)}>
                {STATUS_CONFIG[order.status]?.icon}
                {STATUS_CONFIG[order.status]?.label}
              </div>
            </div>
            <p className="text-brand-muted text-sm mt-1">
              Placed on {order.createdAt.toLocaleDateString('en-LK', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
          className="px-4 py-2 bg-brand-surface border border-brand-border text-brand-text rounded-lg text-sm font-medium hover:bg-brand-surface-hover transition-colors"
        >
          Edit Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b border-brand-border/50 last:border-0 last:pb-0">
                  <div className="w-16 h-16 rounded-lg bg-brand-bg border border-brand-border overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-surface">
                        <Package className="w-6 h-6 text-brand-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-text font-medium truncate">{item.productName}</p>
                    <p className="text-sm text-brand-muted mt-0.5">SKU: {item.sku || 'N/A'}</p>
                    <p className="text-sm text-brand-muted mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-gold font-medium">{formatPrice(item.price * item.quantity)}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-brand-muted mt-0.5">{formatPrice(item.price)} each</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-brand-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Subtotal</span>
                <span className="text-brand-text">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Delivery Fee</span>
                <span className="text-brand-text">{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-brand-border">
                <span className="text-brand-text">Total</span>
                <span className="text-brand-gold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Order Status</h2>
            
            {nextStatuses.length > 0 ? (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    className="form-input appearance-none pr-10"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  >
                    <option value="">Change status to...</option>
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                </div>

                {selectedStatus === 'cancelled' && (
                  <textarea
                    placeholder="Cancellation reason (required for customer notification)"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="form-input resize-none h-20"
                  />
                )}

                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || !selectedStatus || selectedStatus === order.status || (selectedStatus === 'cancelled' && !cancellationReason)}
                  className="w-full py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-brand-muted">This order is in a terminal state and cannot be changed.</p>
            )}
            
            {order.cancellationReason && (
              <div className="mt-4 p-3 bg-brand-danger/10 border border-brand-danger/20 rounded-lg">
                <p className="text-xs font-semibold text-brand-danger mb-1">Cancellation Reason</p>
                <p className="text-sm text-brand-text">{order.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Customer Information</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-brand-muted inline-block w-20">Name:</span> <span className="text-brand-text">{order.customer.name}</span></p>
              <p><span className="text-brand-muted inline-block w-20">Email:</span> <span className="text-brand-text">{order.customer.email}</span></p>
              <p><span className="text-brand-muted inline-block w-20">Phone:</span> <span className="text-brand-text">{order.customer.phone}</span></p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Delivery Address</h2>
            <p className="text-sm text-brand-text leading-relaxed">
              {order.deliveryAddress.addressLine1}<br />
              {order.deliveryAddress.addressLine2 && <>{order.deliveryAddress.addressLine2}<br /></>}
              {order.deliveryAddress.city}, {order.deliveryAddress.district}<br />
              {order.deliveryAddress.postalCode}
            </p>
          </div>

          {/* Tracking & Delivery */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Tracking & Delivery</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-brand-muted inline-block w-24">Tracking:</span>{' '}
                <span className="text-brand-text font-mono">{order.trackingNumber || '—'}</span>
              </p>
              <p>
                <span className="text-brand-muted inline-block w-24">Est. Delivery:</span>{' '}
                <span className="text-brand-text">{order.estimatedDeliveryDate || '—'}</span>
              </p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
              <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Order Notes</h2>
              <p className="text-sm text-brand-text whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto shadow-lg',
              toast.type === 'success' && 'bg-brand-success/10 text-brand-success border border-brand-success/30',
              toast.type === 'error' && 'bg-brand-danger/10 text-brand-danger border border-brand-danger/30',
              toast.type === 'info' && 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.type === 'info' && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

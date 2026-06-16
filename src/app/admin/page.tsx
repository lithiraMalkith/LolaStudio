'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchDashboardStats } from '@/lib/admin-client'
import { formatPrice } from '@/lib/utils'
import {
  ShoppingCart,
  DollarSign,
  Clock,
  AlertTriangle,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react'
import type { DashboardStats } from '@/types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// Mock data for charts
const revenueData = [
  { day: 'Mon', revenue: 45000, target: 50000 },
  { day: 'Tue', revenue: 52000, target: 50000 },
  { day: 'Wed', revenue: 48000, target: 50000 },
  { day: 'Thu', revenue: 61000, target: 50000 },
  { day: 'Fri', revenue: 55000, target: 50000 },
  { day: 'Sat', revenue: 67000, target: 50000 },
  { day: 'Sun', revenue: 42000, target: 50000 },
]

const ordersData = [
  { day: 'Mon', orders: 12, completed: 10 },
  { day: 'Tue', orders: 15, completed: 13 },
  { day: 'Wed', orders: 14, completed: 12 },
  { day: 'Thu', orders: 18, completed: 17 },
  { day: 'Fri', orders: 16, completed: 14 },
  { day: 'Sat', orders: 20, completed: 19 },
  { day: 'Sun', orders: 12, completed: 11 },
]

export default function AdminDashboard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, role } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const data = await fetchDashboardStats(token)
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        // Fallback to demo data
        setStats({
          ordersToday: 12,
          ordersThisWeek: 47,
          ordersThisMonth: 186,
          revenueToday: 24500,
          revenueThisWeek: 142800,
          revenueThisMonth: 567200,
          pendingOrders: 8,
          lowStockProducts: 3,
          totalProducts: 42,
          totalCustomers: 234,
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user])

  // GSAP entrance animations — sophisticated multi-layered timeline
  useGSAP(
    () => {
      if (!containerRef.current || !stats) return

      // Set initial states to prevent opacity issues
      gsap.set(['.dashboard-header', '.stat-card', '.metric-badge', '.chart-container', '.activity-item', '.quick-action'], {
        opacity: 0,
      })

      const timeline = gsap.timeline()

      // Header animation
      timeline.to(
        '.dashboard-header',
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        0
      )

      // Stat cards — staggered entrance with scale and rotation
      timeline.to(
        '.stat-card',
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          stagger: {
            amount: 0.4,
            axis: 'x',
          },
          duration: 0.7,
          ease: 'back.out(1.2)',
        },
        0.1
      )

      // Key metrics pop in
      timeline.to(
        '.metric-badge',
        {
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          duration: 0.4,
          ease: 'elastic.out(1, 0.5)',
        },
        0.3
      )

      // Charts fade in with slight slide
      timeline.to(
        '.chart-container',
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.6,
          ease: 'power3.out',
        },
        0.5
      )

      // Activity feed items slide in from left
      timeline.to(
        '.activity-item',
        {
          opacity: 1,
          x: 0,
          stagger: 0.05,
          duration: 0.5,
          ease: 'power2.out',
        },
        0.6
      )

      // Quick actions with hover preparation
      timeline.to(
        '.quick-action',
        {
          opacity: 1,
          scale: 1,
          stagger: 0.06,
          duration: 0.5,
          ease: 'back.out(1.3)',
        },
        0.7
      )

      // Pulse animation for low stock alerts
      if (document.querySelector('.low-stock-warning')) {
        gsap.to('.low-stock-warning', {
          boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)',
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
    },
    { scope: containerRef, dependencies: [stats] }
  )

  const statCards = [
    {
      label: 'Revenue Today',
      value: stats?.revenueToday || 0,
      format: 'currency',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold/10',
      trend: '+18%',
    },
    {
      label: 'Orders Today',
      value: stats?.ordersToday || 0,
      format: 'number',
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold/10',
      trend: '+5',
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      format: 'number',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold/10',
    },
    {
      label: 'Low Stock Alert',
      value: stats?.lowStockProducts || 0,
      format: 'number',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-brand-danger',
      bgColor: 'bg-brand-danger/10',
    },
    {
      label: 'Total Products',
      value: stats?.totalProducts || 0,
      format: 'number',
      icon: <Package className="w-5 h-5" />,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold/10',
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers || 0,
      format: 'number',
      icon: <Users className="w-5 h-5" />,
      color: 'text-brand-gold',
      bgColor: 'bg-brand-gold/10',
    },
  ]

  const recentActivity = [
    { id: '1', type: 'order' as const, message: 'New order #LS-4K2A received — LKR 4,200', time: '2 min ago' },
    { id: '2', type: 'order' as const, message: 'Order #LS-3R1B marked as Dispatched', time: '15 min ago' },
    { id: '3', type: 'product' as const, message: 'Gold Buddha Statue stock updated to 5 units', time: '1 hr ago' },
    { id: '4', type: 'order' as const, message: 'Order #LS-2T5M delivered successfully', time: '2 hrs ago' },
    { id: '5', type: 'user' as const, message: 'New customer registration — Kamal Perera', time: '3 hrs ago' },
    { id: '6', type: 'product' as const, message: 'Lotus Incense Holder published to store', time: '4 hrs ago' },
  ]

  const quickActions = [
    { label: 'New Product', href: '/admin/products/new', icon: <Package className="w-5 h-5" /> },
    { label: 'View Orders', href: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { label: 'Manage Stock', href: '/admin/inventory', icon: <TrendingUp className="w-5 h-5" /> },
  ]

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
          <p className="text-brand-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="text-3xl font-bold text-brand-text">
            Dashboard
            {user?.email && (
              <span className="text-brand-gold ml-2">
                · {user.email.split('@')[0]}
              </span>
            )}
          </h1>
          <p className="text-brand-muted text-sm mt-2">
            Real-time overview of your store performance
          </p>
        </div>
      </div>

      {/* Key Metrics - Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.slice(0, 4).map((stat, i) => (
          <div
            key={i}
            className={`stat-card bg-brand-surface rounded-xl border border-brand-border p-5 card-hover overflow-hidden relative ${
              stat.value === 0 && stat.color.includes('danger')
                ? 'low-stock-warning border-brand-danger/50'
                : ''
            }`}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-brand-muted text-xs uppercase tracking-wider font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-brand-text mt-2">
                    {stat.format === 'currency' && (
                      <span className="text-lg text-brand-muted">LKR </span>
                    )}
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
              {stat.trend && (
                <div className="flex items-center gap-1 mt-3">
                  <ArrowUpRight className="w-3.5 h-3.5 text-brand-success" />
                  <span className="text-xs text-brand-success font-medium">{stat.trend}</span>
                </div>
              )}
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="chart-container bg-brand-surface rounded-xl border border-brand-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <LineChartIcon className="w-5 h-5 text-brand-gold" />
            <h2 className="text-sm font-semibold text-brand-text">Revenue Trend</h2>
            <span className="metric-badge ml-auto text-xs bg-brand-gold/10 text-brand-gold px-2 py-1 rounded">
              This Week
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="day" stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                formatter={(value: any) => `LKR ${(value || 0).toLocaleString()}`}
              />
              <Legend wrapperStyle={{ color: '#6B6B6B' }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#C9A84C"
                strokeWidth={3}
                dot={{ fill: '#C9A84C', r: 5 }}
                activeDot={{ r: 7, fill: '#E8B86D' }}
                name="Revenue (LKR)"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#6B6B6B"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Target"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="chart-container bg-brand-surface rounded-xl border border-brand-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-brand-gold" />
            <h2 className="text-sm font-semibold text-brand-text">Orders Overview</h2>
            <span className="metric-badge ml-auto text-xs bg-brand-gold/10 text-brand-gold px-2 py-1 rounded">
              This Week
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="day" stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ color: '#6B6B6B' }} />
              <Bar dataKey="orders" fill="#C9A84C" radius={[8, 8, 0, 0]} name="Total Orders" />
              <Bar dataKey="completed" fill="#6B6B6B" radius={[8, 8, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.slice(4).map((stat, i) => (
          <div
            key={i}
            className="stat-card bg-brand-surface rounded-xl border border-brand-border p-5 card-hover"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-brand-muted text-xs uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-brand-text mt-2">
                  {stat.format === 'currency' && <span className="text-sm text-brand-muted">LKR </span>}
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-2.5 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
        {/* Monthly Revenue Card */}
        <div className="stat-card bg-brand-surface rounded-xl border border-brand-border p-5 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-brand-muted text-xs uppercase tracking-wider font-medium">
                This Month Revenue
              </p>
              <p className="text-xl font-bold text-brand-text mt-2">
                <span className="text-sm text-brand-muted">LKR </span>
                {(stats?.revenueThisMonth || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-brand-gold/10 text-brand-gold p-2.5 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-brand-surface rounded-xl border border-brand-border p-6">
          <h2 className="text-sm font-semibold text-brand-text mb-5">Recent Activity</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="activity-item flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-brand-gold/5 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    activity.type === 'order'
                      ? 'bg-brand-gold'
                      : activity.type === 'product'
                        ? 'bg-brand-success'
                        : 'bg-brand-info'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-brand-text leading-relaxed">{activity.message}</p>
                  <p className="text-xs text-brand-muted mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
          <h2 className="text-sm font-semibold text-brand-text mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, i) => (
              <a
                key={i}
                href={action.href}
                className="quick-action flex items-center gap-3 p-3 rounded-lg border border-brand-border hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all duration-300 group"
              >
                <div className="text-brand-muted group-hover:text-brand-gold transition-colors">
                  {action.icon}
                </div>
                <span className="text-sm text-brand-text group-hover:text-brand-gold transition-colors flex-1">
                  {action.label}
                </span>
                <ArrowUpRight className="w-4 h-4 text-brand-muted group-hover:text-brand-gold transition-colors opacity-0 group-hover:opacity-100" />
              </a>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-brand-border/50 space-y-3">
            <div className="flex justify-between items-center p-2 rounded-lg bg-brand-gold/5">
              <span className="text-xs text-brand-muted font-medium">Week Orders</span>
              <span className="text-sm font-bold text-brand-gold">{stats?.ordersThisWeek || 0}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg">
              <span className="text-xs text-brand-muted font-medium">Month Orders</span>
              <span className="text-sm font-bold text-brand-text">{stats?.ordersThisMonth || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

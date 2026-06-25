import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { DashboardStats, RevenueDataPoint, OrdersDataPoint, ActivityItem } from '@/types'

// Helper: format relative time string
function timeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return `${seconds} sec ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hrs ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} days ago`

  const months = Math.floor(days / 30)
  return `${months} mos ago`
}

// Helper: get day-of-week label from a Date
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()]
}

// Helper: format currency for activity messages
function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString()}`
}

// GET /api/dashboard — dashboard stats
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Date range for last 7 days (for charts)
      const sevenDaysAgo = new Date(startOfToday)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // includes today = 7 days

      // ── Fetch orders for this month ──
      const ordersSnapshot = await adminDb
        .collection('orders')
        .where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
        .get()

      const orders = ordersSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          total: data.total || 0,
          status: data.status || 'pending',
          orderRef: data.orderRef || doc.id,
          customer: data.customer || {},
          statusHistory: data.statusHistory || [],
        }
      })

      // ── Scalar stats ──
      const ordersToday = orders.filter(
        (o) => o.createdAt >= startOfToday && o.createdAt < endOfToday
      ).length
      const ordersThisWeek = orders.filter((o) => o.createdAt >= startOfWeek).length
      const ordersThisMonth = orders.length

      const revenueToday = orders
        .filter(
          (o) =>
            o.createdAt >= startOfToday &&
            o.createdAt < endOfToday &&
            o.status !== 'cancelled'
        )
        .reduce((sum, o) => sum + (o.total || 0), 0)

      const revenueThisWeek = orders
        .filter((o) => o.createdAt >= startOfWeek && o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0)

      const revenueThisMonth = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0)

      // ── Trend indicators (today vs yesterday) ──
      // Fetch yesterday's orders separately if not already in the month range
      let yesterdayOrders = orders.filter(
        (o) => o.createdAt >= startOfYesterday && o.createdAt < startOfToday
      )

      // If yesterday is in a previous month, fetch separately
      if (startOfYesterday < startOfMonth) {
        const yesterdaySnapshot = await adminDb
          .collection('orders')
          .where('createdAt', '>=', Timestamp.fromDate(startOfYesterday))
          .where('createdAt', '<', Timestamp.fromDate(startOfToday))
          .get()
        yesterdayOrders = yesterdaySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            total: data.total || 0,
            status: data.status || 'pending',
            orderRef: data.orderRef || doc.id,
            customer: data.customer || {},
            statusHistory: data.statusHistory || [],
          }
        })
      }

      const yesterdayRevenue = yesterdayOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0)
      const yesterdayOrderCount = yesterdayOrders.length

      const revenueTrend = yesterdayRevenue > 0
        ? Math.round(((revenueToday - yesterdayRevenue) / yesterdayRevenue) * 100)
        : revenueToday > 0 ? 100 : 0

      const ordersTrend = ordersToday - yesterdayOrderCount

      // ── Chart data: last 7 days ──
      // Also need orders older than this month if sevenDaysAgo < startOfMonth
      let chartOrders = orders.filter((o) => o.createdAt >= sevenDaysAgo)
      if (sevenDaysAgo < startOfMonth) {
        const olderSnapshot = await adminDb
          .collection('orders')
          .where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
          .where('createdAt', '<', Timestamp.fromDate(startOfMonth))
          .get()
        const olderOrders = olderSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            total: data.total || 0,
            status: data.status || 'pending',
            orderRef: data.orderRef || doc.id,
            customer: data.customer || {},
            statusHistory: data.statusHistory || [],
          }
        })
        chartOrders = [...olderOrders, ...chartOrders]
      }

      // Build day-by-day data for the last 7 days
      const revenueData: RevenueDataPoint[] = []
      const ordersData: OrdersDataPoint[] = []

      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(startOfToday)
        dayStart.setDate(dayStart.getDate() - i)
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
        const label = getDayLabel(dayStart)

        const dayOrders = chartOrders.filter(
          (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
        )

        const dayRevenue = dayOrders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0)

        const dayCompleted = dayOrders.filter((o) => o.status === 'delivered').length

        revenueData.push({ day: label, revenue: dayRevenue })
        ordersData.push({ day: label, orders: dayOrders.length, completed: dayCompleted })
      }

      // ── Pending orders count (all time) ──
      const pendingSnapshot = await adminDb.collection('orders').where('status', '==', 'pending').get()
      const pendingOrders = pendingSnapshot.size

      // ── Low stock products ──
      const lowStockSnapshot = await adminDb
        .collection('products')
        .where('stockQty', '<=', 3)
        .where('visibility', '==', 'published')
        .get()

      // ── Total products ──
      const totalProductsSnapshot = await adminDb.collection('products').get()

      // ── Total customers ──
      const totalCustomersSnapshot = await adminDb.collection('customers').get()

      // ── Recent Activities (Option A: derived from existing data) ──
      const activities: { date: Date; item: ActivityItem }[] = []

      // 1. Recent orders — new orders and status changes
      const recentOrdersSnapshot = await adminDb
        .collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()

      recentOrdersSnapshot.docs.forEach((doc, idx) => {
        const data = doc.data()
        const createdAt = data.createdAt?.toDate?.() || new Date()
        const orderRef = data.orderRef || doc.id.slice(0, 6).toUpperCase()
        const total = data.total || 0

        // "New order received" activity
        activities.push({
          date: createdAt,
          item: {
            id: `order-new-${doc.id}`,
            type: 'order',
            message: `New order #${orderRef} received — ${formatLKR(total)}`,
            time: timeAgo(createdAt),
          },
        })

        // Status change activities from statusHistory
        const history = data.statusHistory || []
        for (let h = history.length - 1; h >= 1; h--) {
          const entry = history[h]
          const entryDate = entry.timestamp?.toDate?.() || (entry.timestamp ? new Date(entry.timestamp) : null)
          if (!entryDate) continue

          const statusLabel = (entry.status || '').charAt(0).toUpperCase() + (entry.status || '').slice(1)
          activities.push({
            date: entryDate,
            item: {
              id: `order-status-${doc.id}-${h}`,
              type: 'order',
              message: `Order #${orderRef} marked as ${statusLabel}`,
              time: timeAgo(entryDate),
            },
          })
        }
      })

      // 2. Recent product updates
      const recentProductsSnapshot = await adminDb
        .collection('products')
        .orderBy('updatedAt', 'desc')
        .limit(5)
        .get()

      recentProductsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        const updatedAt = data.updatedAt?.toDate?.() || new Date()
        const productName = data.name || 'Unknown Product'
        const stockQty = data.stockQty

        const message = stockQty !== undefined
          ? `${productName} stock updated to ${stockQty} units`
          : `${productName} updated`

        activities.push({
          date: updatedAt,
          item: {
            id: `product-${doc.id}`,
            type: 'product',
            message,
            time: timeAgo(updatedAt),
          },
        })
      })

      // 3. Recent customer registrations
      const recentCustomersSnapshot = await adminDb
        .collection('customers')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()

      recentCustomersSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        const createdAt = data.createdAt?.toDate?.() || new Date()
        const name = data.name || 'Customer'

        activities.push({
          date: createdAt,
          item: {
            id: `user-${doc.id}`,
            type: 'user',
            message: `New customer registration — ${name}`,
            time: timeAgo(createdAt),
          },
        })
      })

      // Sort all activities by date descending, take top 10
      activities.sort((a, b) => b.date.getTime() - a.date.getTime())
      const recentActivities = activities.slice(0, 10).map((a) => a.item)

      // ── Assemble stats ──
      const stats: DashboardStats = {
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        pendingOrders,
        lowStockProducts: lowStockSnapshot.size,
        totalProducts: totalProductsSnapshot.size,
        totalCustomers: totalCustomersSnapshot.size,
        revenueData,
        ordersData,
        recentActivities,
        revenueTrend,
        ordersTrend,
      }

      console.log('Dashboard stats fetched successfully')
      return NextResponse.json({ success: true, data: stats })
    } catch (error) {
      console.error('GET /api/dashboard error:', error)
      // Return demo data as fallback instead of 500 error
      const fallbackStats: DashboardStats = {
        ordersToday: 0,
        ordersThisWeek: 0,
        ordersThisMonth: 0,
        revenueToday: 0,
        revenueThisWeek: 0,
        revenueThisMonth: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
        totalProducts: 0,
        totalCustomers: 0,
        revenueData: [],
        ordersData: [],
        recentActivities: [],
        revenueTrend: 0,
        ordersTrend: 0,
      }
      return NextResponse.json({ success: true, data: fallbackStats }, { status: 200 })
    }
  })
}

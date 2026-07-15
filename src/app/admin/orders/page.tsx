'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrders, updateOrderDetails, createOrder, fetchProducts, fetchCustomers } from '@/lib/admin-client'
import { cn, formatPrice } from '@/lib/utils'
import {
  Search,
  Eye,
  ChevronDown,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Package,
  Phone,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  History,
  Plus,
} from 'lucide-react'
import type { Order, OrderStatus, Product, Customer } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; class: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', class: 'status-pending', icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { label: 'Processing', class: 'status-processing', icon: <Package className="w-3.5 h-3.5" /> },
  dispatched: { label: 'Dispatched', class: 'status-dispatched', icon: <Truck className="w-3.5 h-3.5" /> },
  delivered: { label: 'Delivered', class: 'status-delivered', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: <XCircle className="w-3.5 h-3.5" /> },
}

// Valid status transitions
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


export default function OrdersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Edit mode states
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostCode: '',
    trackingNumber: '',
    estimatedDeliveryDate: '',
  })
  const [savingDetails, setSavingDetails] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')

  // Add Order modal states
  const [showAddOrderModal, setShowAddOrderModal] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Add Order form state
  const [newOrderForm, setNewOrderForm] = useState({
    selectedCustomer: '',
    newCustomerName: '',
    newCustomerEmail: '',
    newCustomerPhone: '',
    useNewCustomer: false,
    items: [] as Array<{ productId: string; quantity: number; price: number }>,
    deliveryAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      postalCode: '',
    },
    deliveryFee: 0,
    notes: '',
  })
  const [selectedProductForAdd, setSelectedProductForAdd] = useState('')
  const [selectedProductQuantity, setSelectedProductQuantity] = useState(1)

  // Toast helper
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return
      setLoading(true)
      try {
        const token = await user.getIdToken()
        const rawOrders = await fetchOrders(token)
        setOrders(
          rawOrders.map((order) => ({
            ...order,
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
            statusHistory: order.statusHistory?.map((entry) => ({
              ...entry,
              timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
            })) || [],
          }))
        )
      } catch (error) {
        console.error('Failed to load orders:', error)
        addToast('error', 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user])

  // Load products and customers when modal opens
  useEffect(() => {
    if (!showAddOrderModal || !user) return

    const loadData = async () => {
      const token = await user.getIdToken()

      // Load products
      if (products.length === 0) {
        setLoadingProducts(true)
        try {
          const prods = await fetchProducts(token)
          setProducts(prods)
        } catch (error) {
          console.error('Failed to load products:', error)
          addToast('error', 'Failed to load products')
        } finally {
          setLoadingProducts(false)
        }
      }

      // Load customers
      if (customers.length === 0) {
        setLoadingCustomers(true)
        try {
          const custs = await fetchCustomers(token)
          setCustomers(custs)
        } catch (error) {
          console.error('Failed to load customers:', error)
          addToast('error', 'Failed to load customers')
        } finally {
          setLoadingCustomers(false)
        }
      }
    }

    loadData()
  }, [showAddOrderModal, user])

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const rows = document.querySelectorAll('.order-row')
    if (rows.length > 0) {
      gsap.from('.order-row', { opacity: 0, y: 15, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.2 })
    }
  }, { scope: containerRef })

  // Filter orders based on search and status
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderRef.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search)
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Orders</h1>
          <p className="text-brand-muted text-sm mt-1">{orders.length} total orders</p>
        </div>
        <button
          onClick={() => router.push('/admin/orders/new')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Order
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'processing', 'dispatched', 'delivered', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
              statusFilter === status
                ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
                : 'bg-brand-surface border-brand-border text-brand-muted hover:text-brand-text'
            )}
          >
            {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
            <span className="ml-1.5 text-xs opacity-60">
              {status === 'all' ? orders.length : statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-[448px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search by order ref, name, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="order-row cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <td>
                    <span className="font-mono text-sm text-brand-gold">{order.orderRef}</span>
                  </td>
                  <td>
                    <div>
                      <p className="text-sm font-medium">{order.customer.name}</p>
                      <p className="text-xs text-brand-muted flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.customer.phone}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                  </td>
                  <td>
                    <span className="font-medium text-brand-gold">{formatPrice(order.total)}</span>
                  </td>
                  <td>
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[order.status].class)}>
                      {STATUS_CONFIG[order.status].icon}
                      {STATUS_CONFIG[order.status].label}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-brand-muted">
                      {order.createdAt.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}`); }} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}/edit`); }} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-gold hover:bg-brand-surface-hover transition-colors" title="Edit Order">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto',
              toast.type === 'success' && 'bg-brand-success/10 text-brand-success border border-brand-success/30',
              toast.type === 'error' && 'bg-brand-danger/10 text-brand-danger border border-brand-danger/30',
              toast.type === 'info' && 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.type === 'info' && <Clock className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

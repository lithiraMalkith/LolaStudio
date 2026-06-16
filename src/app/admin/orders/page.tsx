'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrders, updateOrderStatus, updateOrderDetails, createOrder, fetchProducts, fetchCustomers } from '@/lib/admin-client'
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

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order)
    setSelectedStatus('')
    setEditMode(false)
    setCancellationReason('')
    setEditData({
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      deliveryAddress: order.deliveryAddress.addressLine1,
      deliveryCity: order.deliveryAddress.city,
      deliveryPostCode: order.deliveryAddress.postalCode,
      trackingNumber: order.trackingNumber || '',
      estimatedDeliveryDate: order.estimatedDeliveryDate || '',
    })
  }

  const canEditDetails = selectedOrder && ['pending', 'processing'].includes(selectedOrder.status)
  const nextStatuses = selectedOrder ? STATUS_TRANSITIONS[selectedOrder.status] : []

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !selectedStatus || !user) return
    setUpdating(true)

    try {
      const token = await user.getIdToken()
      const payload: any = { status: selectedStatus }
      
      if (selectedStatus === 'cancelled' && cancellationReason) {
        payload.cancellationReason = cancellationReason
      }

      const result = await updateOrderStatus(token, selectedOrder.id, payload)
      
      // Update the selected order and the list
      const updatedOrder = { ...selectedOrder, status: selectedStatus as OrderStatus }
      setSelectedOrder(updatedOrder)
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)))
      setSelectedStatus('')
      setCancellationReason('')
      addToast('success', `Order status updated to ${STATUS_CONFIG[selectedStatus].label}. Email notification sent to customer.`)
    } catch (error: any) {
      console.error('Update order status error:', error)
      addToast('error', error.message || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveDetails = async () => {
    if (!selectedOrder || !user) return
    setSavingDetails(true)

    try {
      const token = await user.getIdToken()
      await updateOrderDetails(token, selectedOrder.id, editData)
      
      // Update the order
      const updatedOrder = {
        ...selectedOrder,
        customer: {
          ...selectedOrder.customer,
          name: editData.customerName,
          email: editData.customerEmail,
          phone: editData.customerPhone,
        },
        deliveryAddress: {
          ...selectedOrder.deliveryAddress,
          addressLine1: editData.deliveryAddress,
          city: editData.deliveryCity,
          postalCode: editData.deliveryPostCode,
        },
        trackingNumber: editData.trackingNumber,
        estimatedDeliveryDate: editData.estimatedDeliveryDate,
      }
      
      setSelectedOrder(updatedOrder)
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)))
      setEditMode(false)
      addToast('success', 'Order details updated successfully')
    } catch (error: any) {
      console.error('Save order details error:', error)
      addToast('error', error.message || 'Failed to save order details')
    } finally {
      setSavingDetails(false)
    }
  }

  // Add Order handlers
  const handleAddProductToOrder = () => {
    if (!selectedProductForAdd || selectedProductQuantity <= 0) {
      addToast('error', 'Please select a product and quantity')
      return
    }

    const product = products.find((p) => p.id === selectedProductForAdd)
    if (!product) return

    // Check if product already in order
    const existingIndex = newOrderForm.items.findIndex((i) => i.productId === selectedProductForAdd)
    
    if (existingIndex >= 0) {
      // Update quantity
      const updatedItems = [...newOrderForm.items]
      updatedItems[existingIndex].quantity += selectedProductQuantity
      setNewOrderForm({ ...newOrderForm, items: updatedItems })
    } else {
      // Add new item
      setNewOrderForm({
        ...newOrderForm,
        items: [
          ...newOrderForm.items,
          {
            productId: product.id,
            quantity: selectedProductQuantity,
            price: product.price,
          },
        ],
      })
    }

    setSelectedProductForAdd('')
    setSelectedProductQuantity(1)
    addToast('success', `${product.name} added to order`)
  }

  const handleRemoveProductFromOrder = (productId: string) => {
    setNewOrderForm({
      ...newOrderForm,
      items: newOrderForm.items.filter((i) => i.productId !== productId),
    })
  }

  const handleSubmitNewOrder = async () => {
    if (!user) return

    // Validation
    if (newOrderForm.items.length === 0) {
      addToast('error', 'Order must contain at least one item')
      return
    }

    const isNewCustomer = newOrderForm.useNewCustomer
    if (isNewCustomer) {
      if (!newOrderForm.newCustomerName || !newOrderForm.newCustomerEmail || !newOrderForm.newCustomerPhone) {
        addToast('error', 'Please fill in all customer information')
        return
      }
    } else {
      if (!newOrderForm.selectedCustomer) {
        addToast('error', 'Please select a customer or create a new one')
        return
      }
    }

    if (
      !newOrderForm.deliveryAddress.addressLine1 ||
      !newOrderForm.deliveryAddress.city ||
      !newOrderForm.deliveryAddress.postalCode
    ) {
      addToast('error', 'Please fill in delivery address')
      return
    }

    setCreatingOrder(true)

    try {
      const token = await user.getIdToken()

      let customerData: any
      if (isNewCustomer) {
        customerData = {
          name: newOrderForm.newCustomerName,
          email: newOrderForm.newCustomerEmail,
          phone: newOrderForm.newCustomerPhone,
        }
      } else {
        const customer = customers.find((c) => c.id === newOrderForm.selectedCustomer)
        if (!customer) {
          addToast('error', 'Customer not found')
          return
        }
        customerData = {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        }
      }

      // Get product names
      const itemsWithNames = newOrderForm.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)
        return {
          productId: item.productId,
          productName: product?.name || item.productId,
          sku: product?.sku || '',
          price: item.price,
          quantity: item.quantity,
          image: product?.images?.[0],
        }
      })

      const createdOrder = await createOrder(token, {
        items: itemsWithNames,
        customer: customerData,
        deliveryAddress: newOrderForm.deliveryAddress,
        notes: newOrderForm.notes,
        deliveryFee: newOrderForm.deliveryFee,
      })

      // Convert dates to Date objects
      const newOrder = {
        ...(createdOrder as Order),
        createdAt: createdOrder.createdAt ? new Date(createdOrder.createdAt) : new Date(),
        updatedAt: createdOrder.updatedAt ? new Date(createdOrder.updatedAt) : new Date(),
        statusHistory: (createdOrder as Order).statusHistory?.map((entry) => ({
          ...entry,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
        })) || [],
      }

      // Add to orders list
      setOrders([newOrder, ...orders])
      
      // Reset form
      setShowAddOrderModal(false)
      setNewOrderForm({
        selectedCustomer: '',
        newCustomerName: '',
        newCustomerEmail: '',
        newCustomerPhone: '',
        useNewCustomer: false,
        items: [],
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

      addToast('success', `Order created successfully: ${(createdOrder as Order).orderRef}`)
    } catch (error: any) {
      console.error('Create order error:', error)
      addToast('error', error.message || 'Failed to create order')
    } finally {
      setCreatingOrder(false)
    }
  }

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
          onClick={() => setShowAddOrderModal(true)}
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
                  onClick={() => handleSelectOrder(order)}
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
                    <button className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelectedOrder(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-[512px] bg-brand-surface border-l border-brand-border z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-brand-text">Order Details</h2>
                  <p className="font-mono text-sm text-brand-gold mt-1">{selectedOrder.orderRef}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Section */}
              <div className="bg-brand-bg rounded-lg border border-brand-border p-4">
                <label className="form-label">Order Status</label>
                <div className="mt-3 flex items-center gap-3">
                  <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', STATUS_CONFIG[selectedOrder.status].class)}>
                    {STATUS_CONFIG[selectedOrder.status].icon}
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </div>
                </div>

                {/* Status Transition */}
                {nextStatuses.length > 0 && (
                  <div className="mt-4 space-y-3">
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

                    {/* Cancellation Reason (only for cancel transition) */}
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
                      disabled={updating || !selectedStatus || selectedStatus === selectedOrder.status || (selectedStatus === 'cancelled' && !cancellationReason)}
                      className="w-full py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? 'Updating...' : 'Update Status & Notify Customer'}
                    </button>
                  </div>
                )}

                {nextStatuses.length === 0 && (
                  <p className="mt-3 text-xs text-brand-muted">This order is in a terminal state and cannot be changed.</p>
                )}
              </div>

              {/* Customer Details */}
              <div className="bg-brand-bg rounded-lg border border-brand-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-brand-text">Customer Information</h3>
                  {canEditDetails && !editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold-hover transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                {editMode && canEditDetails ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={editData.customerName}
                      onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editData.customerEmail}
                      onChange={(e) => setEditData({ ...editData, customerEmail: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={editData.customerPhone}
                      onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                      className="form-input"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDetails}
                        disabled={savingDetails}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex-1 py-2 bg-brand-border text-brand-text rounded-lg text-sm font-medium hover:bg-brand-border-hover transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p><span className="text-brand-muted">Name:</span> <span className="text-brand-text">{selectedOrder.customer.name}</span></p>
                    <p><span className="text-brand-muted">Email:</span> <span className="text-brand-text">{selectedOrder.customer.email}</span></p>
                    <p><span className="text-brand-muted">Phone:</span> <span className="text-brand-text">{selectedOrder.customer.phone}</span></p>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="bg-brand-bg rounded-lg border border-brand-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-brand-text">Delivery Address</h3>
                  {canEditDetails && !editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold-hover transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                {editMode && canEditDetails ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={editData.deliveryAddress}
                      onChange={(e) => setEditData({ ...editData, deliveryAddress: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={editData.deliveryCity}
                      onChange={(e) => setEditData({ ...editData, deliveryCity: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Post Code"
                      value={editData.deliveryPostCode}
                      onChange={(e) => setEditData({ ...editData, deliveryPostCode: e.target.value })}
                      className="form-input"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-brand-text">
                    {selectedOrder.deliveryAddress.addressLine1}<br />
                    {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.district}<br />
                    {selectedOrder.deliveryAddress.postalCode}
                  </p>
                )}
              </div>

              {/* Tracking & Delivery */}
              <div className="bg-brand-bg rounded-lg border border-brand-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-brand-text">Tracking & Delivery</h3>
                  {canEditDetails && !editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold-hover transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                {editMode && canEditDetails ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Tracking Number"
                      value={editData.trackingNumber}
                      onChange={(e) => setEditData({ ...editData, trackingNumber: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="date"
                      placeholder="Est. Delivery Date"
                      value={editData.estimatedDeliveryDate}
                      onChange={(e) => setEditData({ ...editData, estimatedDeliveryDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-brand-muted">Tracking:</span>{' '}
                      <span className="text-brand-text font-mono">{selectedOrder.trackingNumber || '—'}</span>
                    </p>
                    <p>
                      <span className="text-brand-muted">Est. Delivery:</span>{' '}
                      <span className="text-brand-text">{selectedOrder.estimatedDeliveryDate || '—'}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-medium text-brand-text mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-brand-border/50 last:border-0">
                      <div>
                        <p className="text-sm text-brand-text">{item.productName}</p>
                        <p className="text-xs text-brand-muted font-mono">{item.sku} × {item.quantity}</p>
                      </div>
                      <span className="text-sm text-brand-gold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-brand-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Delivery Fee</span>
                  <span>{formatPrice(selectedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-brand-border">
                  <span className="text-brand-text">Total</span>
                  <span className="text-brand-gold">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status History */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="bg-brand-bg rounded-lg border border-brand-border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-4 h-4 text-brand-gold" />
                    <h3 className="text-sm font-medium text-brand-text">Status History</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((entry, i) => (
                      <div key={i} className="text-xs border-l-2 border-brand-gold/30 pl-3">
                        <p className="font-medium text-brand-text">{STATUS_CONFIG[entry.status as OrderStatus]?.label || entry.status}</p>
                        <p className="text-brand-muted text-xs">
                          {entry.timestamp?.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {entry.note && <p className="text-brand-muted mt-1">{entry.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Order Modal */}
      {showAddOrderModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAddOrderModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[672px] max-h-[90vh] bg-brand-surface border border-brand-border rounded-lg z-50 overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-brand-text">Create New Order</h2>
                <button
                  onClick={() => setShowAddOrderModal(false)}
                  className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Selection */}
                <div>
                  <h3 className="text-sm font-medium text-brand-text mb-3">Customer</h3>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!newOrderForm.useNewCustomer}
                        onChange={() =>
                          setNewOrderForm({ ...newOrderForm, useNewCustomer: false })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-brand-text">Select Existing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={newOrderForm.useNewCustomer}
                        onChange={() =>
                          setNewOrderForm({ ...newOrderForm, useNewCustomer: true })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-brand-text">Create New</span>
                    </label>
                  </div>

                  {!newOrderForm.useNewCustomer ? (
                    <div className="relative">
                      <select
                        className="form-input appearance-none pr-10"
                        value={newOrderForm.selectedCustomer}
                        onChange={(e) =>
                          setNewOrderForm({ ...newOrderForm, selectedCustomer: e.target.value })
                        }
                        disabled={loadingCustomers}
                      >
                        <option value="">
                          {loadingCustomers ? 'Loading customers...' : 'Select a customer'}
                        </option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} ({customer.email})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Customer Name"
                        value={newOrderForm.newCustomerName}
                        onChange={(e) =>
                          setNewOrderForm({ ...newOrderForm, newCustomerName: e.target.value })
                        }
                        className="form-input"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newOrderForm.newCustomerEmail}
                        onChange={(e) =>
                          setNewOrderForm({ ...newOrderForm, newCustomerEmail: e.target.value })
                        }
                        className="form-input"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={newOrderForm.newCustomerPhone}
                        onChange={(e) =>
                          setNewOrderForm({ ...newOrderForm, newCustomerPhone: e.target.value })
                        }
                        className="form-input"
                      />
                    </div>
                  )}
                </div>

                {/* Items Selection */}
                <div>
                  <h3 className="text-sm font-medium text-brand-text mb-3">Add Items</h3>
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                      <select
                        className="form-input appearance-none pr-10"
                        value={selectedProductForAdd}
                        onChange={(e) => setSelectedProductForAdd(e.target.value)}
                        disabled={loadingProducts}
                      >
                        <option value="">
                          {loadingProducts ? 'Loading products...' : 'Select a product'}
                        </option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({formatPrice(product.price)})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={selectedProductQuantity}
                      onChange={(e) => setSelectedProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="form-input w-20"
                    />
                    <button
                      onClick={handleAddProductToOrder}
                      className="px-4 py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Items List */}
                  {newOrderForm.items.length > 0 && (
                    <div className="bg-brand-bg rounded-lg border border-brand-border p-3 space-y-2">
                      {newOrderForm.items.map((item) => {
                        const product = products.find((p) => p.id === item.productId)
                        return (
                          <div key={item.productId} className="flex items-center justify-between py-2 border-b border-brand-border/50 last:border-0">
                            <div>
                              <p className="text-sm text-brand-text">{product?.name}</p>
                              <p className="text-xs text-brand-muted">{item.quantity} × {formatPrice(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-brand-gold font-medium">{formatPrice(item.quantity * item.price)}</span>
                              <button
                                onClick={() => handleRemoveProductFromOrder(item.productId)}
                                className="p-1 rounded text-brand-muted hover:text-brand-danger transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="text-sm font-medium text-brand-text mb-3">Delivery Address</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={newOrderForm.deliveryAddress.addressLine1}
                      onChange={(e) =>
                        setNewOrderForm({
                          ...newOrderForm,
                          deliveryAddress: { ...newOrderForm.deliveryAddress, addressLine1: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Apt/Suite (Optional)"
                      value={newOrderForm.deliveryAddress.addressLine2}
                      onChange={(e) =>
                        setNewOrderForm({
                          ...newOrderForm,
                          deliveryAddress: { ...newOrderForm.deliveryAddress, addressLine2: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newOrderForm.deliveryAddress.city}
                        onChange={(e) =>
                          setNewOrderForm({
                            ...newOrderForm,
                            deliveryAddress: { ...newOrderForm.deliveryAddress, city: e.target.value },
                          })
                        }
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="District"
                        value={newOrderForm.deliveryAddress.district}
                        onChange={(e) =>
                          setNewOrderForm({
                            ...newOrderForm,
                            deliveryAddress: { ...newOrderForm.deliveryAddress, district: e.target.value },
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={newOrderForm.deliveryAddress.postalCode}
                      onChange={(e) =>
                        setNewOrderForm({
                          ...newOrderForm,
                          deliveryAddress: { ...newOrderForm.deliveryAddress, postalCode: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Delivery Fee (Optional)"
                    value={newOrderForm.deliveryFee}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, deliveryFee: parseFloat(e.target.value) || 0 })
                    }
                    className="form-input"
                  />
                  <textarea
                    placeholder="Order Notes (Optional)"
                    value={newOrderForm.notes}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                    className="form-input resize-none h-20"
                  />
                </div>

                {/* Totals Preview */}
                {newOrderForm.items.length > 0 && (
                  <div className="bg-brand-bg rounded-lg border border-brand-border p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-muted">Subtotal</span>
                      <span className="text-brand-text">
                        {formatPrice(
                          newOrderForm.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-muted">Delivery Fee</span>
                      <span className="text-brand-text">{formatPrice(newOrderForm.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-brand-border">
                      <span className="text-brand-text">Total</span>
                      <span className="text-brand-gold">
                        {formatPrice(
                          newOrderForm.items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
                            newOrderForm.deliveryFee
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddOrderModal(false)}
                    className="flex-1 py-2.5 bg-brand-border text-brand-text rounded-lg text-sm font-medium hover:bg-brand-border-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitNewOrder}
                    disabled={creatingOrder || newOrderForm.items.length === 0}
                    className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingOrder ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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

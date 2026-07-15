'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { cn, formatPrice } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { fetchOrder, updateOrderDetails } from '@/lib/admin-client'
import type { Order } from '@/types'
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', class: 'status-pending', icon: <Clock className="w-4 h-4" /> },
  processing: { label: 'Processing', class: 'status-processing', icon: <Package className="w-4 h-4" /> },
  dispatched: { label: 'Dispatched', class: 'status-dispatched', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Delivered', class: 'status-delivered', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: <XCircle className="w-4 h-4" /> },
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export default function EditOrderPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostCode: '',
    trackingNumber: '',
    estimatedDeliveryDate: '',
  })

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
        setOrder(data)

        setFormData({
          customerName: data.customer.name || '',
          customerEmail: data.customer.email || '',
          customerPhone: data.customer.phone || '',
          deliveryAddress: data.deliveryAddress.addressLine1 || '',
          deliveryCity: data.deliveryAddress.city || '',
          deliveryPostCode: data.deliveryAddress.postalCode || '',
          trackingNumber: data.trackingNumber || '',
          estimatedDeliveryDate: data.estimatedDeliveryDate || '',
        })
      } catch (error: any) {
        console.error('Failed to load order:', error)
        addToast('error', error.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [user, orderId])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user || !order) return

    setSaving(true)
    try {
      const token = await user.getIdToken()
      
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        deliveryCity: formData.deliveryCity,
        deliveryPostCode: formData.deliveryPostCode,
        trackingNumber: formData.trackingNumber,
        estimatedDeliveryDate: formData.estimatedDeliveryDate,
      }

      await updateOrderDetails(token, order.id, payload)
      
      addToast('success', 'Order details updated successfully')
      setTimeout(() => {
        router.push('/admin/orders')
      }, 1000)

    } catch (error: any) {
      console.error('Failed to update order details:', error)
      addToast('error', error.message || 'Failed to update order details')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
          <p className="text-brand-muted mt-1">The order you're trying to edit doesn't exist.</p>
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

  return (
    <div ref={containerRef} className="max-w-[896px] mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-brand-text">Edit Order</h1>
            <p className="font-mono text-brand-gold text-sm mt-0.5">{order.orderRef}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm border font-medium bg-brand-bg', STATUS_CONFIG[order.status]?.class)}>
            {STATUS_CONFIG[order.status]?.icon}
            {STATUS_CONFIG[order.status]?.label}
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  className="form-input"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => updateField('customerEmail', e.target.value)}
                    className="form-input"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => updateField('customerPhone', e.target.value)}
                    className="form-input"
                    placeholder="+94..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  value={formData.deliveryAddress}
                  onChange={(e) => updateField('deliveryAddress', e.target.value)}
                  className="form-input"
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={formData.deliveryCity}
                    onChange={(e) => updateField('deliveryCity', e.target.value)}
                    className="form-input"
                    placeholder="Colombo"
                  />
                </div>
                <div>
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    value={formData.deliveryPostCode}
                    onChange={(e) => updateField('deliveryPostCode', e.target.value)}
                    className="form-input"
                    placeholder="00100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tracking & Delivery */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Tracking & Delivery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Tracking Number</label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => updateField('trackingNumber', e.target.value)}
                  className="form-input"
                  placeholder="Tracking ID"
                />
              </div>
              <div>
                <label className="form-label">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={formData.estimatedDeliveryDate}
                  onChange={(e) => updateField('estimatedDeliveryDate', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Summary Snapshot */}
          <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
            <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Order Items</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 py-2 border-b border-brand-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-text truncate" title={item.productName}>{item.productName}</p>
                    <p className="text-xs text-brand-muted font-mono">{item.sku || 'N/A'} × {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm text-brand-gold font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-brand-border space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-brand-border">
                <span className="text-brand-text">Total</span>
                <span className="text-brand-gold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
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

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { cn, formatPrice } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { fetchProducts, fetchCustomers, createOrder } from '@/lib/admin-client'
import type { Product, Customer } from '@/types'
import {
  ArrowLeft,
  Save,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export default function NewOrderPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuth()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const [form, setForm] = useState({
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

  useGSAP(() => {
    const sections = document.querySelectorAll('.form-section')
    if (sections.length > 0) {
      gsap.from('.form-section', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
    }
  }, { scope: containerRef })

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      const token = await user.getIdToken()

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
    loadData()
  }, [user])

  const handleAddProductToOrder = () => {
    if (!selectedProductForAdd || selectedProductQuantity < 1) return

    const product = products.find((p) => p.id === selectedProductForAdd)
    if (!product) return

    const existingItem = form.items.find((i) => i.productId === selectedProductForAdd)

    if (existingItem) {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.productId === selectedProductForAdd
            ? { ...i, quantity: i.quantity + selectedProductQuantity }
            : i
        ),
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: selectedProductForAdd,
            quantity: selectedProductQuantity,
            price: product.price,
          },
        ],
      }))
    }

    setSelectedProductForAdd('')
    setSelectedProductQuantity(1)
  }

  const handleRemoveProductFromOrder = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.productId !== productId),
    }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user || form.items.length === 0) return
    setIsSubmitting(true)

    try {
      const token = await user.getIdToken()
      
      let customerData: { name: string; email: string; phone: string; uid?: string }
      if (form.useNewCustomer) {
        customerData = {
          name: form.newCustomerName,
          email: form.newCustomerEmail,
          phone: form.newCustomerPhone,
        }
      } else {
        const selected = customers.find((c) => c.id === form.selectedCustomer)
        if (!selected) throw new Error('Please select a customer')
        customerData = {
          name: selected.name,
          email: selected.email,
          phone: selected.phone,
        }
      }

      const orderItems = form.items.map((item) => {
        const p = products.find((prod) => prod.id === item.productId)
        return {
          productId: item.productId,
          productName: p?.name || 'Unknown Product',
          sku: p?.sku || '',
          price: item.price,
          quantity: item.quantity,
          image: p?.images?.[0],
        }
      })

      const payload = {
        items: orderItems,
        customer: customerData,
        deliveryAddress: form.deliveryAddress,
        deliveryFee: form.deliveryFee,
        notes: form.notes,
        isPaid: false, 
        paymentMethod: 'cash_on_delivery',
        totalAmount:
          orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) +
          form.deliveryFee,
      }

      await createOrder(token, payload as any)
      
      addToast('success', 'Order created successfully')
      setTimeout(() => {
        router.push('/admin/orders')
      }, 1000)

    } catch (error: any) {
      console.error('Failed to create order:', error)
      addToast('error', error.message || 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-2xl font-semibold text-brand-text">New Order</h1>
            <p className="text-brand-muted text-sm mt-0.5">Create a new order manually</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || form.items.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Customer Selection */}
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Customer Information</h2>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!form.useNewCustomer}
                onChange={() => setForm({ ...form, useNewCustomer: false })}
                className="w-4 h-4 text-brand-gold focus:ring-brand-gold"
              />
              <span className="text-sm text-brand-text">Select Existing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={form.useNewCustomer}
                onChange={() => setForm({ ...form, useNewCustomer: true })}
                className="w-4 h-4 text-brand-gold focus:ring-brand-gold"
              />
              <span className="text-sm text-brand-text">Create New</span>
            </label>
          </div>

          {!form.useNewCustomer ? (
            <div className="relative">
              <select
                className="form-input appearance-none pr-10"
                value={form.selectedCustomer}
                onChange={(e) => setForm({ ...form, selectedCustomer: e.target.value })}
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
                value={form.newCustomerName}
                onChange={(e) => setForm({ ...form, newCustomerName: e.target.value })}
                className="form-input"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.newCustomerEmail}
                onChange={(e) => setForm({ ...form, newCustomerEmail: e.target.value })}
                className="form-input"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.newCustomerPhone}
                onChange={(e) => setForm({ ...form, newCustomerPhone: e.target.value })}
                className="form-input"
              />
            </div>
          )}
        </div>

        {/* Items Selection */}
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Order Items</h2>
          <div className="flex gap-2">
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
              className="form-input w-24"
            />
            <button
              onClick={handleAddProductToOrder}
              className="px-4 py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
            >
              Add
            </button>
          </div>

          {/* Items List */}
          {form.items.length > 0 && (
            <div className="bg-brand-bg rounded-lg border border-brand-border p-3 space-y-2 mt-4">
              {form.items.map((item) => {
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
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Delivery Address</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Street Address"
              value={form.deliveryAddress.addressLine1}
              onChange={(e) => setForm({ ...form, deliveryAddress: { ...form.deliveryAddress, addressLine1: e.target.value } })}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Apt/Suite (Optional)"
              value={form.deliveryAddress.addressLine2}
              onChange={(e) => setForm({ ...form, deliveryAddress: { ...form.deliveryAddress, addressLine2: e.target.value } })}
              className="form-input"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={form.deliveryAddress.city}
                onChange={(e) => setForm({ ...form, deliveryAddress: { ...form.deliveryAddress, city: e.target.value } })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="District"
                value={form.deliveryAddress.district}
                onChange={(e) => setForm({ ...form, deliveryAddress: { ...form.deliveryAddress, district: e.target.value } })}
                className="form-input"
              />
            </div>
            <input
              type="text"
              placeholder="Postal Code"
              value={form.deliveryAddress.postalCode}
              onChange={(e) => setForm({ ...form, deliveryAddress: { ...form.deliveryAddress, postalCode: e.target.value } })}
              className="form-input"
            />
          </div>
        </div>

        {/* Additional Options */}
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Additional Options</h2>
          <div className="space-y-3">
            <div>
              <label className="form-label mb-2 block">Delivery Fee (LKR)</label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label mb-2 block">Order Notes</label>
              <textarea
                placeholder="Optional notes for this order"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="form-input resize-none h-24"
              />
            </div>
          </div>
        </div>

        {/* Totals Preview */}
        {form.items.length > 0 && (
          <div className="form-section bg-brand-bg rounded-xl border border-brand-border p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Subtotal</span>
              <span className="text-brand-text">
                {formatPrice(
                  form.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-muted">Delivery Fee</span>
              <span className="text-brand-text">{formatPrice(form.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-4 border-t border-brand-border mt-4">
              <span className="text-brand-text">Total</span>
              <span className="text-brand-gold">
                {formatPrice(
                  form.items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
                  form.deliveryFee
                )}
              </span>
            </div>
          </div>
        )}
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

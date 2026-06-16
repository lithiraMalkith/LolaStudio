'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { cn, formatPrice } from '@/lib/utils'
import { ArrowLeft, Package } from 'lucide-react'
import type { Product } from '@/types'

export default function ViewProductPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const productId = params.id as string

  useEffect(() => {
    const loadProduct = async () => {
      if (!user || !productId) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const res = await fetch(`/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!res.ok) throw new Error('Failed to load product')
        
        const result = await res.json()
        const data = result.data || result
        const productData: Product = {
          ...data,
          price: Number(data.price) || 0,
          cost: Number(data.cost) || 0,
          stockQty: Number(data.stockQty) || 0,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        }
        setProduct(productData)
      } catch (error) {
        console.error('Failed to load product:', error)
        router.push('/admin/products')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [user, productId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-brand-muted mx-auto mb-3" />
        <p className="text-brand-text">Product not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">{product.name}</h1>
          <p className="text-brand-muted text-sm mt-1">SKU: {product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Product Info */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Product Information</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Description</label>
                <p className="text-brand-text text-sm">{product.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Price</label>
                  <p className="text-brand-gold font-medium text-lg">{formatPrice(product.price)}</p>
                </div>
                <div>
                  <label className="form-label">Cost</label>
                  <p className="text-brand-text">{formatPrice(product.cost)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <p className="text-brand-text">{product.category}</p>
                </div>
                <div>
                  <label className="form-label">Subcategory</label>
                  <p className="text-brand-text">{product.subCategory}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Stock Quantity</label>
                <p className={cn('text-lg font-medium', product.stockQty > 0 ? 'text-brand-success' : 'text-brand-danger')}>
                  {product.stockQty} units
                </p>
              </div>
              <div>
                <label className="form-label">SKU</label>
                <p className="text-brand-text font-mono text-sm">{product.sku}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-text mb-3">Status</h3>
            <span
              className={cn(
                'inline-block px-3 py-1.5 rounded-full text-xs font-medium',
                product.visibility === 'published'
                  ? 'bg-brand-success/15 text-brand-success'
                  : 'bg-brand-muted/15 text-brand-muted'
              )}
            >
              {product.visibility === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>

          {/* Actions */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-text mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/admin/products/${productId}/edit`)}
                className="w-full py-2.5 px-4 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
              >
                Edit Product
              </button>
              <button
                onClick={() => router.back()}
                className="w-full py-2.5 px-4 bg-brand-surface-hover text-brand-text rounded-lg text-sm font-medium hover:bg-brand-border transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-brand-bg rounded-xl border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-text mb-3">Dates</h3>
            <div className="space-y-2 text-xs text-brand-muted">
              <div>
                <p className="text-brand-muted">Created</p>
                <p className="text-brand-text">{product.createdAt.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-brand-muted">Updated</p>
                <p className="text-brand-text">{product.updatedAt.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

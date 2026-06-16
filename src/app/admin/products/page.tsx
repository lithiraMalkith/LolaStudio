'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchProducts } from '@/lib/admin-client'
import { cn, formatPrice, truncate } from '@/lib/utils'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Package,
  Image as ImageIcon,
} from 'lucide-react'
import type { Product } from '@/types'

export default function ProductsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'published' | 'draft'>('all')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const rawProducts = await fetchProducts(token)
        setProducts(
          rawProducts.map((product) => ({
            ...product,
            createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
            updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          }))
        )
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [user])

  useGSAP(
    () => {
      gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
      const rows = document.querySelectorAll('.product-row')
      if (rows.length > 0) {
        gsap.from('.product-row', {
          opacity: 0,
          y: 15,
          stagger: 0.05,
          duration: 0.4,
          ease: 'power2.out',
          delay: 0.2,
        })
      }
    },
    { scope: containerRef }
  )

  const handleDeleteProduct = async () => {
    if (!deleteConfirmId || !user) return
    setIsDeleting(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/products/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      setProducts(products.filter((p) => p.id !== deleteConfirmId))
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filterVisibility === 'all' || p.visibility === filterVisibility
    return matchesSearch && matchesFilter
  })

  const getStockBadge = (product: Product) => {
    if (product.stockQty === 0) return <span className="status-cancelled px-2 py-0.5 rounded-full text-xs">Out of Stock</span>
    if (product.stockQty <= 3) return <span className="status-pending px-2 py-0.5 rounded-full text-xs">Low Stock ({product.stockQty})</span>
    return <span className="status-delivered px-2 py-0.5 rounded-full text-xs">In Stock ({product.stockQty})</span>
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Products</h1>
          <p className="text-brand-muted text-sm mt-1">{products.length} products in catalogue</p>
        </div>
        <button
          onClick={() => router.push('/admin/products/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterVisibility(f)}
              className={cn(
                'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                filterVisibility === f
                  ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
                  : 'bg-brand-surface border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-border-hover'
              )}
            >
              <Filter className="w-3.5 h-3.5 inline-block mr-1.5" />
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="product-row">
                  <td>
                    <div className="w-10 h-10 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center">
                      {product.images.length > 0 ? (
                        <ImageIcon className="w-4 h-4 text-brand-muted" />
                      ) : (
                        <Package className="w-4 h-4 text-brand-muted" />
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-brand-text">{product.name}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{truncate(product.description, 50)}</p>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-brand-muted">{product.sku}</span>
                  </td>
                  <td>
                    <div>
                      <p className="text-sm">{product.category}</p>
                      <p className="text-xs text-brand-muted">{product.subCategory}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-brand-gold font-medium">{formatPrice(product.price)}</span>
                  </td>
                  <td>{getStockBadge(product)}</td>
                  <td>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        product.visibility === 'published'
                          ? 'bg-brand-success/15 text-brand-success'
                          : 'bg-brand-muted/15 text-brand-muted'
                      )}
                    >
                      {product.visibility === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === product.id ? null : product.id)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === product.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 py-1">
                          <button
                            onClick={() => { setActiveMenu(null); router.push(`/admin/products/${product.id}`) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-surface-hover transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => { setActiveMenu(null); router.push(`/admin/products/${product.id}/edit`) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-surface-hover transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => { setActiveMenu(null); setDeleteConfirmId(product.id) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-danger hover:bg-brand-danger/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package className="w-10 h-10 text-brand-muted mx-auto mb-3" />
                    <p className="text-brand-muted text-sm">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-[384px]">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Delete Product?</h2>
            <p className="text-brand-muted text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-brand-danger text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

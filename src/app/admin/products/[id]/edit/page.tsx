'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { cn, formatPrice } from '@/lib/utils'
import { ArrowLeft, Package, Save, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react'
import type { Product } from '@/types'

const CATEGORIES = [
  { name: 'Spiritual & Zen', subs: ['Buddha Statues', 'Incense Holders', 'Meditation Accessories'] },
  { name: 'Home Decor', subs: ['Wall Art', 'Ornaments & Figurines', 'Candle Holders'] },
  { name: 'Gift Sets', subs: ['Curated Gift Bundles'] },
]

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    cost: 0,
    sku: '',
    category: '',
    subCategory: '',
    stockQty: 0,
    visibility: 'draft' as 'draft' | 'published',
    dimensions: '',
    material: '',
    color: '',
    weight: '',
  })

  const productId = params.id as string
  const availableSubs = CATEGORIES.find((c) => c.name === formData.category)?.subs || []

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
        setProduct({
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        })
        setFormData({
          name: data.name,
          description: data.description,
          price: data.price,
          cost: data.cost || 0,
          sku: data.sku,
          category: data.category,
          subCategory: data.subCategory,
          stockQty: data.stockQty,
          visibility: data.visibility,
          dimensions: data.dimensions || '',
          material: data.material || '',
          color: data.color || '',
          weight: data.weight || '',
        })
        setImages(data.images || [])
      } catch (error) {
        console.error('Failed to load product:', error)
        setError('Failed to load product')
        setTimeout(() => router.push('/admin/products'), 2000)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [user, productId, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    setSaving(true)
    setError(null)
    try {
      const token = await user.getIdToken()
      const newUrls: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        })

        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        newUrls.push(data.url)
      }
      setImages((prev) => [...prev, ...newUrls])
    } catch (error) {
      console.error('Failed to upload image:', error)
      setError('Failed to upload image')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!user || !productId) return
    setSaving(true)
    setError(null)

    try {
      const token = await user.getIdToken()
      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        cost: formData.cost,
        sku: formData.sku,
        category: formData.category,
        subCategory: formData.subCategory,
        stockQty: formData.stockQty,
        visibility: formData.visibility,
        dimensions: formData.dimensions || undefined,
        material: formData.material || undefined,
        color: formData.color || undefined,
        weight: formData.weight || undefined,
        images: images,
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      router.push('/admin/products')
    } catch (error: any) {
      console.error('Failed to save product:', error)
      setError(error.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

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
          <h1 className="text-2xl font-semibold text-brand-text">Edit Product</h1>
          <p className="text-brand-muted text-sm mt-1">{product.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border border-brand-danger/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-danger">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave() }} className="col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Product Information</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="form-input resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Price (LKR)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Cost (LKR)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="form-input"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                    className="form-input appearance-none"
                    required
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Subcategory</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="form-input appearance-none"
                    disabled={!formData.category}
                    required
                  >
                    <option value="">Select subcategory...</option>
                    {availableSubs.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-brand-text mb-2">Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square bg-brand-bg rounded-lg border border-brand-border flex items-center justify-center group overflow-hidden">
                  {img.startsWith('http') || img.startsWith('blob') ? (
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-brand-muted" />
                  )}
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-brand-danger/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-square bg-brand-bg rounded-lg border-2 border-dashed border-brand-border hover:border-brand-gold/50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <Upload className="w-6 h-6 text-brand-muted group-hover:text-brand-gold transition-colors" />
                <span className="text-xs text-brand-muted group-hover:text-brand-gold mt-1 transition-colors">Upload</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} disabled={saving} />
              </label>
            </div>
            <p className="text-xs text-brand-muted">Upload product images. WebP format recommended. Max 5MB each.</p>
          </div>

          {/* Inventory */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stockQty}
                  onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'draft' | 'published' })}
                  className="form-input appearance-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Attributes (Optional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Dimensions / Size</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 15cm × 10cm × 8cm"
                />
              </div>
              <div>
                <label className="form-label">Material</label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Ceramic, Brass, Wood"
                />
              </div>
              <div>
                <label className="form-label">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Gold, Black, Natural"
                />
              </div>
              <div>
                <label className="form-label">Weight</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 500g, 1.2kg"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-text mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => router.back()}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-brand-surface-hover text-brand-text rounded-lg text-sm font-medium hover:bg-brand-border disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-brand-bg rounded-xl border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-text mb-3">Profit Margin</h3>
            <p className="text-2xl font-bold text-brand-gold">
              {formData.price > formData.cost
                ? `${(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%`
                : '0%'}
            </p>
            <p className="text-xs text-brand-muted mt-2">
              Gross profit: {formatPrice(formData.price - formData.cost)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

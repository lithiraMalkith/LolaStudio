'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react'

interface ProductFormData {
  name: string
  description: string
  price: string
  dimensions: string
  material: string
  color: string
  weight: string
  stockQty: string
  category: string
  subCategory: string
  visibility: 'published' | 'draft'
  sku: string
}

const CATEGORIES = [
  { name: 'Spiritual & Zen', subs: ['Buddha Statues', 'Incense Holders', 'Meditation Accessories'] },
  { name: 'Home Decor', subs: ['Wall Art', 'Ornaments & Figurines', 'Candle Holders'] },
  { name: 'Gift Sets', subs: ['Curated Gift Bundles'] },
]

const INITIAL_FORM: ProductFormData = {
  name: '', description: '', price: '', dimensions: '', material: '', color: '',
  weight: '', stockQty: '0', category: '', subCategory: '', visibility: 'draft', sku: '',
}

export default function NewProductPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM)
  const [images, setImages] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  useGSAP(() => {
    const sections = document.querySelectorAll('.form-section')
    if (sections.length > 0) {
      gsap.from('.form-section', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out' })
    }
  }, { scope: containerRef })

  const updateField = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    setIsSubmitting(true)
    try {
      const token = await user.getIdToken()
      const newUrls: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        newUrls.push(data.url)
      }
      setImages((prev) => [...prev, ...newUrls])
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Check console for details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableSubs = CATEGORIES.find((c) => c.name === form.category)?.subs || []

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.subCategory) e.subCategory = 'Sub-category is required'
    if (!form.sku.trim()) e.sku = 'SKU code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user) return

    setIsSubmitting(true)
    try {
      const token = await user.getIdToken()
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stockQty: parseInt(form.stockQty) || 0,
        category: form.category,
        subCategory: form.subCategory,
        visibility: form.visibility,
        sku: form.sku,
        dimensions: form.dimensions || undefined,
        material: form.material || undefined,
        color: form.color || undefined,
        weight: form.weight || undefined,
        images: images.length > 0 ? images : undefined,
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('API error:', error)
        alert(`Error: ${error.error || 'Failed to create product'}`)
        return
      }

      alert('Product created successfully!')
      router.push('/admin/products')
    } catch (error) {
      console.error('Failed to create product:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div ref={containerRef} className="max-w-[896px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-brand-text">New Product</h1>
            <p className="text-brand-muted text-sm mt-0.5">Add a new product to your catalogue</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateField('visibility', form.visibility === 'published' ? 'draft' : 'published')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors',
              form.visibility === 'published'
                ? 'border-brand-success/30 bg-brand-success/10 text-brand-success'
                : 'border-brand-border bg-brand-surface text-brand-muted'
            )}
          >
            {form.visibility === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {form.visibility === 'published' ? 'Published' : 'Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Basic Information</h2>
          <div>
            <label className="form-label">Product Name *</label>
            <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className={cn('form-input', errors.name && 'border-brand-danger')} placeholder="e.g. Golden Buddha Statue" />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className={cn('form-input min-h-30 resize-none', errors.description && 'border-brand-danger')} placeholder="Describe the product in detail..." />
            {errors.description && <p className="form-error">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">SKU Code *</label>
              <input type="text" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} className={cn('form-input font-mono', errors.sku && 'border-brand-danger')} placeholder="LS-SPI-0001" />
              {errors.sku && <p className="form-error">{errors.sku}</p>}
            </div>
            <div>
              <label className="form-label">Price (LKR) *</label>
              <input type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} className={cn('form-input', errors.price && 'border-brand-danger')} placeholder="0.00" min="0" step="0.01" />
              {errors.price && <p className="form-error">{errors.price}</p>}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Images</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square bg-brand-bg rounded-lg border border-brand-border flex items-center justify-center group overflow-hidden">
                {img.startsWith('http') || img.startsWith('blob') ? (
                  <img src={img} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-brand-muted" />
                )}
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 rounded-full bg-brand-danger/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square bg-brand-bg rounded-lg border-2 border-dashed border-brand-border hover:border-brand-gold/50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <Upload className="w-6 h-6 text-brand-muted group-hover:text-brand-gold transition-colors" />
              <span className="text-xs text-brand-muted group-hover:text-brand-gold mt-1 transition-colors">Upload</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} disabled={isSubmitting} />
            </label>
          </div>
          <p className="text-xs text-brand-muted">Upload product images. WebP format recommended. Max 5MB each.</p>
        </div>

        {/* Category & Stock */}
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Category & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category *</label>
              <select value={form.category} onChange={(e) => { updateField('category', e.target.value); updateField('subCategory', '') }} className={cn('form-input appearance-none', errors.category && 'border-brand-danger')}>
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <p className="form-error">{errors.category}</p>}
            </div>
            <div>
              <label className="form-label">Sub-Category *</label>
              <select value={form.subCategory} onChange={(e) => updateField('subCategory', e.target.value)} className={cn('form-input appearance-none', errors.subCategory && 'border-brand-danger')} disabled={!form.category}>
                <option value="">Select sub-category...</option>
                {availableSubs.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subCategory && <p className="form-error">{errors.subCategory}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">Stock Quantity</label>
            <input type="number" value={form.stockQty} onChange={(e) => updateField('stockQty', e.target.value)} className="form-input w-32" min="0" />
          </div>
        </div>

        {/* Attributes */}
        <div className="form-section bg-brand-surface rounded-xl border border-brand-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider">Attributes (Optional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Dimensions / Size</label>
              <input type="text" value={form.dimensions} onChange={(e) => updateField('dimensions', e.target.value)} className="form-input" placeholder="e.g. 15cm × 10cm × 8cm" />
            </div>
            <div>
              <label className="form-label">Material</label>
              <input type="text" value={form.material} onChange={(e) => updateField('material', e.target.value)} className="form-input" placeholder="e.g. Ceramic, Brass, Wood" />
            </div>
            <div>
              <label className="form-label">Color</label>
              <input type="text" value={form.color} onChange={(e) => updateField('color', e.target.value)} className="form-input" placeholder="e.g. Gold, Black, Natural" />
            </div>
            <div>
              <label className="form-label">Weight</label>
              <input type="text" value={form.weight} onChange={(e) => updateField('weight', e.target.value)} className="form-input" placeholder="e.g. 500g, 1.2kg" />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

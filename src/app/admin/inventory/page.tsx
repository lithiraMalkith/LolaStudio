'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { fetchInventory, updateInventoryStock } from '@/lib/admin-client'
import { Search, AlertTriangle, Package, Minus, Plus, Save } from 'lucide-react'
import type { Product } from '@/types'

export default function InventoryPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [inventory, setInventory] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const rows = document.querySelectorAll('.inventory-row')
    if (rows.length > 0) {
      gsap.from('.inventory-row', { opacity: 0, y: 15, stagger: 0.04, duration: 0.4, ease: 'power2.out', delay: 0.2 })
    }
  }, { scope: containerRef, dependencies: [inventory.length] })

  useEffect(() => {
    const loadInventory = async () => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const items = await fetchInventory(token)
        setInventory(
          items.map((item) => ({
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          }))
        )
      } catch (error) {
        console.error('Failed to load inventory:', error)
      }
    }

    loadInventory()
  }, [user])

  const getDisplayStock = (item: Product) => {
    return item.stockQty + (stockChanges[item.id] || 0)
  }

  const adjustStock = (id: string, delta: number) => {
    setStockChanges((prev) => {
      const current = prev[id] || 0
      const item = inventory.find((i) => i.id === id)
      if (!item) return prev
      const newTotal = item.stockQty + current + delta
      if (newTotal < 0) return prev
      return { ...prev, [id]: current + delta }
    })
  }

  const filtered = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())
    const matchesLowStock = !showLowOnly || item.stockQty <= 3
    return matchesSearch && matchesLowStock
  })

  const lowStockCount = inventory.filter((i) => i.stockQty <= 3).length
  const outOfStockCount = inventory.filter((i) => i.stockQty === 0).length
  const hasChanges = Object.keys(stockChanges).length > 0

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const token = await user.getIdToken()
      const updatePromises = Object.entries(stockChanges).map(async ([productId, delta]) => {
        const product = inventory.find((item) => item.id === productId)
        if (!product) return null
        const newStockQty = product.stockQty + delta
        if (newStockQty < 0) return null
        await updateInventoryStock(token, productId, newStockQty)
        return { productId, newStockQty }
      })

      const results = await Promise.all(updatePromises)
      setInventory((prev) =>
        prev.map((item) => {
          const updated = results.find((result) => result?.productId === item.id)
          return updated
            ? { ...item, stockQty: updated.newStockQty, updatedAt: new Date() }
            : item
        })
      )
      setStockChanges({})
    } catch (error) {
      console.error('Failed to save inventory changes:', error)
      alert('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Inventory</h1>
          <p className="text-brand-muted text-sm mt-1">Manage stock levels across all products</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : `Save Changes (${Object.keys(stockChanges).length})`}
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface rounded-xl border border-brand-border p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-brand-success/10">
            <Package className="w-5 h-5 text-brand-success" />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wider">Total SKUs</p>
            <p className="text-xl font-semibold text-brand-text mt-0.5">{inventory.length}</p>
          </div>
        </div>
        <div className="bg-brand-surface rounded-xl border border-brand-border p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-brand-warning/10">
            <AlertTriangle className="w-5 h-5 text-brand-warning" />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wider">Low Stock</p>
            <p className="text-xl font-semibold text-brand-warning mt-0.5">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-brand-surface rounded-xl border border-brand-border p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-brand-danger/10">
            <Package className="w-5 h-5 text-brand-danger" />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase tracking-wider">Out of Stock</p>
            <p className="text-xl font-semibold text-brand-danger mt-0.5">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <input type="text" placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
        </div>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={cn(
            'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border flex items-center gap-2',
            showLowOnly
              ? 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning'
              : 'bg-brand-surface border-brand-border text-brand-muted hover:text-brand-text'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Low Stock Only
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Adjust</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const displayStock = getDisplayStock(item)
                const hasChange = stockChanges[item.id] !== undefined
                return (
                  <tr key={item.id} className={cn('inventory-row', hasChange && 'bg-brand-gold-muted/30')}>
                    <td>
                      <p className="font-medium text-brand-text">{item.name}</p>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-brand-muted">{item.sku}</span>
                    </td>
                    <td>
                      <span className="text-sm">{item.category}</span>
                    </td>
                    <td>
                      <span className={cn(
                        'text-lg font-semibold',
                        displayStock === 0 ? 'text-brand-danger' : displayStock <= 3 ? 'text-brand-warning' : 'text-brand-text'
                      )}>
                        {displayStock}
                      </span>
                      {hasChange && (
                        <span className={cn('text-xs ml-2', stockChanges[item.id]! > 0 ? 'text-brand-success' : 'text-brand-danger')}>
                          ({stockChanges[item.id]! > 0 ? '+' : ''}{stockChanges[item.id]})
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustStock(item.id, -1)}
                          className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-text hover:border-brand-border-hover transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          className="w-16 h-8 text-center form-input px-1 text-sm"
                          value={stockChanges[item.id] || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            if (item.stockQty + val >= 0) {
                              setStockChanges((prev) => ({ ...prev, [item.id]: val }))
                            }
                          }}
                          placeholder="±0"
                        />
                        <button
                          onClick={() => adjustStock(item.id, 1)}
                          className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-text hover:border-brand-border-hover transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td>
                      {displayStock === 0 ? (
                        <span className="status-cancelled px-2 py-0.5 rounded-full text-xs">Out of Stock</span>
                      ) : displayStock <= 3 ? (
                        <span className="status-pending px-2 py-0.5 rounded-full text-xs">Low Stock</span>
                      ) : (
                        <span className="status-delivered px-2 py-0.5 rounded-full text-xs">In Stock</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-brand-muted">
                        {item.updatedAt?.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

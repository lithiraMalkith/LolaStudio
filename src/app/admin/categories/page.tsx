'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchCategories } from '@/lib/admin-client'
import { Plus, Edit2, Trash2, FolderTree, ChevronRight } from 'lucide-react'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingDesc, setEditingDesc] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSubCategoryModal, setShowSubCategoryModal] = useState<string | null>(null)
  const [newSubCategoryName, setNewSubCategoryName] = useState('')
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false)
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null)
  const [editingSubCategoryName, setEditingSubCategoryName] = useState('')
  const [isUpdatingSubCategory, setIsUpdatingSubCategory] = useState(false)
  const [deleteSubCategoryConfirm, setDeleteSubCategoryConfirm] = useState<{ categoryId: string; subCategoryId: string } | null>(null)
  const [isDeletingSubCategory, setIsDeletingSubCategory] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const rawCategories = await fetchCategories(token)
        setCategories(
          rawCategories.map((category) => ({
            ...category,
            createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
            updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
          }))
        )
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [user])

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const cards = document.querySelectorAll('.category-card')
    if (cards.length > 0) {
      gsap.from('.category-card', { opacity: 0, y: 20, stagger: 0.1, duration: 0.5, ease: 'power3.out', delay: 0.15 })
    }
  }, { scope: containerRef, dependencies: [categories.length] })

  const handleEditCategory = (category: Category) => {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingDesc(category.description || '')
  }

  const handleUpdateCategory = async () => {
    if (!editingId || !user || !editingName.trim()) return
    setIsUpdating(true)

    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/categories/${editingId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName, description: editingDesc }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }

      const updatedCategory = await res.json()
      setCategories(
        categories.map((c) =>
          c.id === editingId
            ? {
                ...updatedCategory.data,
                createdAt: new Date(updatedCategory.data.createdAt),
                updatedAt: new Date(updatedCategory.data.updatedAt),
              }
            : c
        )
      )
      setEditingId(null)
      setEditingName('')
      setEditingDesc('')
    } catch (error) {
      console.error('Failed to update category:', error)
      alert('Failed to update category')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteConfirmId || !user) return
    setIsDeleting(true)

    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/categories/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }

      setCategories(categories.filter((c) => c.id !== deleteConfirmId))
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddSubCategory = async (categoryId: string) => {
    if (!user || !newSubCategoryName.trim()) return
    setIsAddingSubCategory(true)

    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubCategoryName }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }

      // Update local state with new subcategory
      setCategories(
        categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subCategories: [
                  ...c.subCategories,
                  {
                    id: Date.now().toString(),
                    name: newSubCategoryName,
                    slug: newSubCategoryName.toLowerCase().replace(/\s+/g, '-'),
                  },
                ],
              }
            : c
        )
      )
      setShowSubCategoryModal(null)
      setNewSubCategoryName('')
    } catch (error) {
      console.error('Failed to add sub-category:', error)
      alert('Failed to add sub-category')
    } finally {
      setIsAddingSubCategory(false)
    }
  }

  const handleDeleteSubCategory = async (categoryId: string, subCategoryId: string) => {
    if (!user) return
    setIsDeletingSubCategory(true)

    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCategoryId, action: 'delete' }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }

      // Update local state
      setCategories(
        categories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subCategories: c.subCategories.filter((sub) => sub.id !== subCategoryId),
              }
            : c
        )
      )
      setDeleteSubCategoryConfirm(null)
    } catch (error) {
      console.error('Failed to delete sub-category:', error)
      alert('Failed to delete sub-category')
    } finally {
      setIsDeletingSubCategory(false)
    }
  }

  const handleAddCategory = async () => {
    if (!user || !newCategoryName.trim()) return
    setIsAdding(true)

    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }

      const newCategory = await res.json()
      setCategories([
        {
          ...newCategory.data,
          createdAt: new Date(newCategory.data.createdAt),
          updatedAt: new Date(newCategory.data.updatedAt),
        },
        ...categories,
      ])
      setShowAddModal(false)
      setNewCategoryName('')
      setNewCategoryDesc('')
    } catch (error) {
      console.error('Failed to add category:', error)
      alert('Failed to add category')
    } finally {
      setIsAdding(false)
    }
  }

  const totalSubCategories = categories.reduce((a, c) => a + c.subCategories.length, 0)

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Categories</h1>
          <p className="text-brand-muted text-sm mt-1">{categories.length} categories, {totalSubCategories} sub-categories</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <p className="text-brand-muted">Loading categories...</p>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="category-card bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                    <FolderTree className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-text">{category.name}</h3>
                    {category.description && <p className="text-xs text-brand-muted mt-0.5">{category.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(category.id)}
                    className="p-2 rounded-lg text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="px-6 py-3">
                {category.subCategories.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-2.5 border-b border-brand-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
                      <span className="text-sm text-brand-text">{sub.name}</span>
                      <span className="text-xs text-brand-muted font-mono">/{sub.slug}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded text-brand-muted hover:text-brand-text transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteSubCategoryConfirm({ categoryId: category.id, subCategoryId: sub.id })}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-danger transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setShowSubCategoryModal(category.id)
                    setNewSubCategoryName('')
                  }}
                  className="flex items-center gap-1.5 py-2 text-xs text-brand-muted hover:text-brand-gold transition-colors mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Sub-Category
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-4">New Category</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Name</label>
                  <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="form-input" placeholder="e.g. Spiritual & Zen" />
                </div>
                <div>
                  <label className="form-label">Description (optional)</label>
                  <textarea value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)} className="form-input min-h-20 resize-none" placeholder="Brief description..." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={isAdding || !newCategoryName.trim()}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
                >
                  {isAdding ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Category Modal */}
      {editingId && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditingId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-4">Edit Category</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Name</label>
                  <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Description (optional)</label>
                  <textarea value={editingDesc} onChange={(e) => setEditingDesc(e.target.value)} className="form-input min-h-20 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCategory}
                  disabled={isUpdating || !editingName.trim()}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Category'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setDeleteConfirmId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-2">Delete Category?</h2>
              <p className="text-sm text-brand-muted mb-6">This action cannot be undone. All subcategories will also be deleted.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-brand-danger text-white rounded-lg text-sm font-medium hover:bg-brand-danger/90 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Sub-Category Modal */}
      {showSubCategoryModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowSubCategoryModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-4">Add Sub-Category</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Sub-Category Name</label>
                  <input
                    type="text"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Chakra Balancing"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSubCategoryModal(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddSubCategory(showSubCategoryModal)}
                  disabled={isAddingSubCategory || !newSubCategoryName.trim()}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
                >
                  {isAddingSubCategory ? 'Adding...' : 'Add Sub-Category'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Sub-Category Confirmation Modal */}
      {deleteSubCategoryConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setDeleteSubCategoryConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-2">Delete Sub-Category?</h2>
              <p className="text-sm text-brand-muted mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteSubCategoryConfirm(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    deleteSubCategoryConfirm &&
                    handleDeleteSubCategory(deleteSubCategoryConfirm.categoryId, deleteSubCategoryConfirm.subCategoryId)
                  }
                  disabled={isDeletingSubCategory}
                  className="flex-1 py-2.5 bg-brand-danger text-white rounded-lg text-sm font-medium hover:bg-brand-danger/90 transition-colors disabled:opacity-50"
                >
                  {isDeletingSubCategory ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

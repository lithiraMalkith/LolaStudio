'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchRoles } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  BUILT_IN_ROLE_PERMISSIONS,
  BUILT_IN_ROLE_LABELS,
  isBuiltInRole,
  type Permission,
} from '@/lib/permissions'
import { Shield, Plus, Edit2, Trash2, Lock, Check, X } from 'lucide-react'
import type { CustomRole } from '@/types'

export default function RolesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingPermissions, setEditingPermissions] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadRoles = async () => {
      if (!user) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const rawRoles = await fetchRoles(token)
        setCustomRoles(
          rawRoles.map((role) => ({
            ...role,
            createdAt: role.createdAt ? new Date(role.createdAt) : new Date(),
          }))
        )
      } catch (error) {
        console.error('Failed to load roles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [user])

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const cards = document.querySelectorAll('.role-card')
    if (cards.length > 0) {
      gsap.from('.role-card', { opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power3.out', delay: 0.15 })
    }
  }, { scope: containerRef })

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const handleCreateRole = async () => {
    if (!user || !newRoleName || selectedPermissions.length === 0) return
    setIsCreating(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoleName,
          permissions: selectedPermissions,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      const data = await res.json()
      setCustomRoles([...customRoles, data.data])
      setShowCreateModal(false)
      setNewRoleName('')
      setSelectedPermissions([])
    } catch (error) {
      console.error('Failed to create role:', error)
      alert('Failed to create role')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditRole = (role: CustomRole) => {
    setEditingRole(role)
    setEditingName(role.name)
    setEditingPermissions(role.permissions)
  }

  const handleUpdateRole = async () => {
    if (!user || !editingRole || !editingName || editingPermissions.length === 0) return
    setIsUpdating(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName,
          permissions: editingPermissions,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      setCustomRoles(customRoles.map((r) => r.id === editingRole.id ? { ...r, name: editingName, permissions: editingPermissions } : r))
      setEditingRole(null)
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!user || !deleteConfirmId) return
    setIsDeleting(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/roles/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      setCustomRoles(customRoles.filter((r) => r.id !== deleteConfirmId))
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete role:', error)
      alert('Failed to delete role')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Roles & Permissions</h1>
          <p className="text-brand-muted text-sm mt-1">Manage built-in and custom roles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </button>
      </div>

      {/* Built-in Roles */}
      <div>
        <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-3">Built-in Roles</h2>
        <div className="space-y-3">
          {Object.entries(BUILT_IN_ROLE_LABELS).map(([roleKey, label]) => (
            <div key={roleKey} className="role-card bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
              <button
                onClick={() => setExpandedRole(expandedRole === roleKey ? null : roleKey)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    roleKey === 'superadmin' ? 'bg-brand-gold/15' : 'bg-brand-info/10'
                  )}>
                    {roleKey === 'superadmin' ? (
                      <Shield className="w-5 h-5 text-brand-gold" />
                    ) : (
                      <Shield className="w-5 h-5 text-brand-info" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-text">{label}</h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {roleKey === 'superadmin'
                        ? 'Full access to all modules'
                        : `${BUILT_IN_ROLE_PERMISSIONS[roleKey]?.length || 0} permissions`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs bg-brand-muted/15 text-brand-muted">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Built-in
                  </span>
                </div>
              </button>
              {expandedRole === roleKey && (
                <div className="px-6 pb-4 border-t border-brand-border/50">
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(roleKey === 'superadmin' ? ['All Permissions'] : BUILT_IN_ROLE_PERMISSIONS[roleKey] || []).map((perm) => (
                      <div key={perm} className="flex items-center gap-2 text-sm py-1">
                        <Check className="w-3.5 h-3.5 text-brand-success" />
                        <span className="text-brand-text-secondary">
                          {perm === 'All Permissions' ? perm : PERMISSION_LABELS[perm as Permission] || perm}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div>
        <h2 className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wider mb-3">Custom Roles</h2>
        {loading ? (
          <div className="text-brand-muted">Loading custom roles...</div>
        ) : customRoles.length === 0 ? (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center">
            <Shield className="w-10 h-10 text-brand-muted mx-auto mb-3" />
            <p className="text-brand-muted text-sm">No custom roles created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customRoles.map((role) => (
              <div key={role.id} className="role-card bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
                <div className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <button
                    onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                    className="flex-1 text-left flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-gold-muted flex items-center justify-center">
                      <Shield className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium text-brand-text">{role.name}</h3>
                      <p className="text-xs text-brand-muted mt-0.5">{role.permissions.length} permissions</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-brand-gold/10 text-brand-gold">Custom</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditRole(role) }}
                      className="p-1.5 rounded text-brand-muted hover:text-brand-text transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(role.id) }}
                      className="p-1.5 rounded text-brand-muted hover:text-brand-danger transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {expandedRole === role.id && (
                  <div className="px-6 pb-4 border-t border-brand-border/50">
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {role.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-2 text-sm py-1">
                          <Check className="w-3.5 h-3.5 text-brand-success" />
                          <span className="text-brand-text-secondary">
                            {PERMISSION_LABELS[perm as Permission] || perm}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-brand-muted mt-3">
                      Created {role.createdAt.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Custom Role Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[672px] p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-brand-text">Create Custom Role</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-brand-muted hover:text-brand-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="form-label">Role Name</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Photography Editor"
                  />
                </div>

                <div>
                  <label className="form-label mb-3">Permissions</label>
                  <div className="space-y-4">
                    {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                      <div key={group}>
                        <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">{group}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label
                              key={perm}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                                selectedPermissions.includes(perm)
                                  ? 'bg-brand-gold-muted border-brand-gold/30'
                                  : 'bg-brand-bg border-brand-border hover:border-brand-border-hover'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm)}
                                onChange={() => togglePermission(perm)}
                                className="sr-only"
                              />
                              <div className={cn(
                                'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                                selectedPermissions.includes(perm)
                                  ? 'bg-brand-gold border-brand-gold'
                                  : 'border-brand-border'
                              )}>
                                {selectedPermissions.includes(perm) && <Check className="w-3 h-3 text-brand-bg" />}
                              </div>
                              <span className="text-sm text-brand-text">{PERMISSION_LABELS[perm] || perm}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  disabled={isCreating || !newRoleName || selectedPermissions.length === 0}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Custom Role Modal */}
      {editingRole && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditingRole(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[672px] p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-brand-text">Edit Role</h2>
                <button onClick={() => setEditingRole(null)} className="text-brand-muted hover:text-brand-text">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="form-label">Role Name</label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label mb-3">Permissions</label>
                  <div className="space-y-4">
                    {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                      <div key={group}>
                        <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">{group}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label
                              key={perm}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                                editingPermissions.includes(perm)
                                  ? 'bg-brand-gold-muted border-brand-gold/30'
                                  : 'bg-brand-bg border-brand-border hover:border-brand-border-hover'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={editingPermissions.includes(perm)}
                                onChange={() => {
                                  setEditingPermissions((prev) =>
                                    prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
                                  )
                                }}
                                className="sr-only"
                              />
                              <div className={cn(
                                'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                                editingPermissions.includes(perm)
                                  ? 'bg-brand-gold border-brand-gold'
                                  : 'border-brand-border'
                              )}>
                                {editingPermissions.includes(perm) && <Check className="w-3 h-3 text-brand-bg" />}
                              </div>
                              <span className="text-sm text-brand-text">{PERMISSION_LABELS[perm] || perm}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border">
                <button
                  onClick={() => setEditingRole(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={isUpdating || !editingName || editingPermissions.length === 0}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-[384px]">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Delete Role?</h2>
            <p className="text-brand-muted text-sm mb-6">This action cannot be undone. Users assigned to this role will lose access.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
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

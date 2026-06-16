'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchUsers } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import { BUILT_IN_ROLE_LABELS } from '@/lib/permissions'
import {
  Search,
  Plus,
  Mail,
  Shield,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Send,
  AlertCircle,
} from 'lucide-react'
import type { UserProfile, CustomRole } from '@/types'

function getDefaultRoles() {
  return Object.entries(BUILT_IN_ROLE_LABELS).map(([key, label]) => ({ key, label }))
}

export default function UsersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [allRoles, setAllRoles] = useState(getDefaultRoles())
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const rawUsers = await fetchUsers(token)
        setUsers(
          rawUsers.map((userProfile) => ({
            ...userProfile,
            createdAt: userProfile.createdAt ? new Date(userProfile.createdAt) : new Date(),
            lastLoginAt: userProfile.lastLoginAt ? new Date(userProfile.lastLoginAt) : undefined,
          }))
        )
        
        // Load custom roles
        const rolesRes = await fetch('/api/roles', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json()
          const customRoles = rolesData.data.filter((r: CustomRole) => r.isCustom)
          setAllRoles([
            ...getDefaultRoles(),
            ...customRoles.map((r: CustomRole) => ({ key: r.id, label: r.name })),
          ])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const rows = document.querySelectorAll('.user-row')
    if (rows.length > 0) {
      gsap.from('.user-row', { opacity: 0, y: 15, stagger: 0.05, duration: 0.4, ease: 'power2.out', delay: 0.2 })
    }
  }, { scope: containerRef })

  const getRoleLabel = (role: string) => {
    const found = allRoles.find((r) => r.key === role)
    return found?.label || role
  }

  const handleInviteUser = async () => {
    if (!user || !inviteEmail || !inviteName || !inviteRole) return
    setIsSending(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          displayName: inviteName,
          role: inviteRole,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      alert('Invite sent successfully!')
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('')
    } catch (error) {
      console.error('Failed to send invite:', error)
      alert('Failed to send invite')
    } finally {
      setIsSending(false)
    }
  }

  const handleChangeRole = (targetUser: UserProfile) => {
    setEditingUserId(targetUser.uid)
    setEditingRole(targetUser.role)
  }

  const handleUpdateRole = async () => {
    if (!user || !editingUserId || !editingRole) return
    setIsUpdating(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: editingRole }),
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      setUsers(users.map((u) => u.uid === editingUserId ? { ...u, role: editingRole } : u))
      setEditingUserId(null)
      setActiveMenu(null)
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (!user) return
    setIsDeactivating(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      setUsers(users.map((u) => u.uid === userId ? { ...u, isActive: !currentActive } : u))
      setDeactivateConfirmId(null)
      setActiveMenu(null)
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      alert('Failed to update user status')
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleRevokeAccess = async () => {
    if (!user || !revokeConfirmId) return
    setIsRevoking(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/users/${revokeConfirmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const error = await res.json()
        alert(`Error: ${error.error}`)
        return
      }
      setUsers(users.filter((u) => u.uid !== revokeConfirmId))
      setRevokeConfirmId(null)
      setActiveMenu(null)
    } catch (error) {
      console.error('Failed to revoke access:', error)
      alert('Failed to revoke access')
    } finally {
      setIsRevoking(false)
    }
  }

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">User Management</h1>
          <p className="text-brand-muted text-sm mt-1">{users.length} team members</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-[448px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-brand-muted">Loading users...</div>
      ) : (
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.uid} className="user-row">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-gold/15 flex items-center justify-center shrink-0">
                        <span className="text-brand-gold text-sm font-medium">
                          {user.displayName.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-brand-text text-sm">{user.displayName}</p>
                        <p className="text-xs text-brand-muted flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      user.role === 'superadmin'
                        ? 'bg-brand-gold/15 text-brand-gold'
                        : 'bg-brand-info/10 text-brand-info'
                    )}>
                      <Shield className="w-3 h-3" />
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                      user.isActive
                        ? 'bg-brand-success/15 text-brand-success'
                        : 'bg-brand-muted/15 text-brand-muted'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', user.isActive ? 'bg-brand-success' : 'bg-brand-muted')} />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-brand-muted">
                      {user.lastLoginAt
                        ? user.lastLoginAt.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Never'}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-brand-muted">
                      {user.createdAt.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === user.uid ? null : user.uid)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover transition-colors"
                        disabled={user.role === 'superadmin'}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenu === user.uid && user.role !== 'superadmin' && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-10 py-1">
                          <button
                            onClick={() => { handleChangeRole(user); setActiveMenu(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-surface-hover transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Change Role
                          </button>
                          <button
                            onClick={() => { setDeactivateConfirmId(user.uid); setActiveMenu(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-surface-hover transition-colors"
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => { setRevokeConfirmId(user.uid); setActiveMenu(null) }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-danger hover:bg-brand-danger/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Revoke Access
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowInviteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-brand-text">Invite Team Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="text-brand-muted hover:text-brand-text">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Display Name</label>
                  <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="form-input" placeholder="Full name" />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="form-input" placeholder="user@example.com" />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="form-input appearance-none">
                    <option value="">Select a role...</option>
                    {allRoles.filter((r) => r.key !== 'superadmin').map((role) => (
                      <option key={role.key} value={role.key}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleInviteUser}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSending || !inviteEmail || !inviteName || !inviteRole}
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Change Role Modal */}
      {editingUserId && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditingUserId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-brand-text">Change User Role</h2>
                <button onClick={() => setEditingUserId(null)} className="text-brand-muted hover:text-brand-text">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Role</label>
                  <select value={editingRole} onChange={(e) => setEditingRole(e.target.value)} className="form-input appearance-none">
                    {allRoles.filter((r) => r.key !== 'superadmin').map((role) => (
                      <option key={role.key} value={role.key}>{role.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingUserId(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deactivate/Activate Confirmation Modal */}
      {deactivateConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-[384px]">
            <h2 className="text-lg font-semibold text-brand-text mb-4">
              {users.find((u) => u.uid === deactivateConfirmId)?.isActive ? 'Deactivate User?' : 'Activate User?'}
            </h2>
            <p className="text-brand-muted text-sm mb-6">
              {users.find((u) => u.uid === deactivateConfirmId)?.isActive
                ? 'This user will lose access to the admin panel.'
                : 'This user will regain access to the admin panel.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeactivateConfirmId(null)}
                disabled={isDeactivating}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const user = users.find((u) => u.uid === deactivateConfirmId)
                  if (user) handleToggleActive(deactivateConfirmId, user.isActive)
                }}
                disabled={isDeactivating}
                className="flex-1 px-4 py-2 bg-brand-warning text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {isDeactivating ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Confirmation Modal */}
      {revokeConfirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-[384px]">
            <h2 className="text-lg font-semibold text-brand-text mb-4">Revoke Access?</h2>
            <p className="text-brand-muted text-sm mb-6">This action cannot be undone. The user will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeConfirmId(null)}
                disabled={isRevoking}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-brand-text hover:bg-brand-surface-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeAccess}
                disabled={isRevoking}
                className="flex-1 px-4 py-2 bg-brand-danger text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isRevoking ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

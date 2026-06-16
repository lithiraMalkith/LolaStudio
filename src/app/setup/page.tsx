'use client'

import { useState } from 'react'
import { Button } from '@/components/button'
import toast from 'react-hot-toast'

export default function SetupPage() {
  const [email, setEmail] = useState('admin@lolastudio.com')
  const [password, setPassword] = useState('AdminPassword123!')
  const [role, setRole] = useState<'superadmin' | 'manager' | 'fulfillment' | 'support'>('superadmin')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  const createUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`✅ User created: ${email}`)
        setEmail('')
        setPassword('')
        await fetchUsers()
      } else {
        toast.error(`❌ ${data.error}`)
      }
    } catch (error) {
      toast.error('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/setup?action=list')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch users', error)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-brand-gold mb-2">Lola Studio Setup</h1>
          <p className="text-brand-muted">Create test admin users for development</p>
          <p className="text-xs text-brand-danger mt-2">⚠️ DELETE THIS PAGE BEFORE PRODUCTION!</p>
        </div>

        {/* Create User Form */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-brand-text">Create Test User</h2>

          <div>
            <label className="text-sm text-brand-muted mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lolastudio.com"
              className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text"
            />
          </div>

          <div>
            <label className="text-sm text-brand-muted mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text"
            />
          </div>

          <div>
            <label className="text-sm text-brand-muted mb-1 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text"
            >
              <option value="superadmin">Super Admin (All Permissions)</option>
              <option value="manager">Manager (Products, Orders, Dashboard)</option>
              <option value="fulfillment">Fulfillment Staff (Orders Only)</option>
              <option value="support">Support Staff (Read-Only)</option>
            </select>
          </div>

          <Button onClick={createUser} isLoading={loading} className="w-full">
            Create User
          </Button>
        </div>

        {/* Test Accounts Quick Reference */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Quick Setup</h2>
          <p className="text-sm text-brand-muted mb-4">
            Click buttons below to auto-fill common test accounts:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                name: 'Super Admin',
                email: 'admin@lolastudio.com',
                role: 'superadmin',
              },
              {
                name: 'Manager',
                email: 'manager@lolastudio.com',
                role: 'manager',
              },
              {
                name: 'Fulfillment',
                email: 'fulfillment@lolastudio.com',
                role: 'fulfillment',
              },
              {
                name: 'Support',
                email: 'support@lolastudio.com',
                role: 'support',
              },
            ].map((preset) => (
              <button
                key={preset.email}
                onClick={() => {
                  setEmail(preset.email)
                  setPassword('TestPassword123!')
                  setRole(preset.role as any)
                }}
                className="px-3 py-2 rounded-lg bg-brand-gold-muted text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* List Users */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-text">Existing Users</h2>
            <Button size="sm" variant="secondary" onClick={fetchUsers}>
              Refresh
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="text-brand-muted text-sm py-4 text-center">No users created yet</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className="bg-brand-bg rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-brand-text font-medium text-sm">{user.email}</p>
                    <p className="text-brand-muted text-xs">{user.displayName}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-gold/20 text-brand-gold">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Login Instructions */}
        <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-brand-text">Next Steps</h2>
          <ol className="text-sm text-brand-text space-y-2 list-decimal list-inside">
            <li>Create a user above (or use Quick Setup)</li>
            <li>
              Go to <a href="/login" className="text-brand-gold hover:underline">/login</a>
            </li>
            <li>Use the email and password you created</li>
            <li>You&apos;ll be redirected to /admin dashboard</li>
            <li>Google OAuth: Make sure you&apos;ve configured it in Firebase Console!</li>
          </ol>
        </div>

        {/* Firebase Config Check */}
        <div className="bg-brand-danger/10 border border-brand-danger/30 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-brand-danger">⚠️ Important</h2>
          <ul className="text-sm text-brand-text space-y-1 list-disc list-inside">
            <li>
              Make sure <code className="bg-brand-bg px-1 rounded">FIREBASE_PRIVATE_KEY</code> is set in .env.local
            </li>
            <li>For Google OAuth: Configure redirect URI in Firebase Console</li>
            <li>Delete this page (/setup) before going to production!</li>
            <li>Test users should only be for development</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

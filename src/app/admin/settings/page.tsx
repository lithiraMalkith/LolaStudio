'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchSettings, updateSettings } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import {
  Save,
  Globe,
  Truck,
  Bell,
  CreditCard,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  ExternalLink,
  Check,
} from 'lucide-react'
import type { SiteSettings, DeliveryZone } from '@/types'

type Tab = 'general' | 'delivery' | 'notifications' | 'integrations'

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddZoneModal, setShowAddZoneModal] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneFee, setNewZoneFee] = useState(0)
  const [isAddingZone, setIsAddingZone] = useState(false)
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState({
    newOrderEmail: true,
    orderConfirmation: true,
    orderStatusUpdates: true,
    lowStockAlerts: false,
  })

  useGSAP(() => {
    if (loading || !settings) return
    gsap.to('.page-header', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    const panels = document.querySelectorAll('.settings-panel')
    if (panels.length > 0) {
      gsap.to('.settings-panel', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.2 })
    }
  }, { scope: containerRef, dependencies: [loading, settings] })

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return
      setLoading(true)
      setError(null)

      try {
        const token = await user.getIdToken()
        const fetchedSettings = await fetchSettings(token)
        setSettings(fetchedSettings)
      } catch (error) {
        console.error('Failed to load settings:', error)
        setError('Failed to load settings. Using defaults.')
        // Set default settings on error
        setSettings({
          siteName: 'Lola Studio',
          siteDescription: 'Handmade home décor & spiritual goods',
          ownerEmail: '',
          ownerPhone: '',
          currency: 'LKR',
          codEnabled: true,
          deliveryZones: [],
          socialLinks: { tiktok: '', instagram: '', facebook: '' },
          metaPixelId: '',
          tiktokPixelId: '',
        })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user])

  const handleSave = async () => {
    if (!settings || !user) return
    setSaving(true)

    try {
      const token = await user.getIdToken()
      await updateSettings(token, settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCOD = () => {
    setSettings((prev) => prev ? { ...prev, codEnabled: !prev.codEnabled } : null)
  }

  const handleToggleZone = (zoneId: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            deliveryZones: prev.deliveryZones.map((z) =>
              z.id === zoneId ? { ...z, isActive: !z.isActive } : z
            ),
          }
        : null
    )
  }

  const handleAddZone = () => {
    if (!settings || !newZoneName.trim() || newZoneFee < 0) return
    setIsAddingZone(true)

    try {
      const newZone: DeliveryZone = {
        id: Date.now().toString(),
        name: newZoneName,
        fee: newZoneFee,
        isActive: true,
      }
      setSettings((prev) => prev ? { ...prev, deliveryZones: [...prev.deliveryZones, newZone] } : null)
      setShowAddZoneModal(false)
      setNewZoneName('')
      setNewZoneFee(0)
    } finally {
      setIsAddingZone(false)
    }
  }

  const handleDeleteZone = (zoneId: string) => {
    setSettings((prev) =>
      prev
        ? { ...prev, deliveryZones: prev.deliveryZones.filter((z) => z.id !== zoneId) }
        : null
    )
    setDeleteZoneId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brand-muted">Loading settings...</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-muted">Failed to load settings</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: 'General', icon: <Globe className="w-4 h-4" /> },
    { key: 'delivery', label: 'Delivery Zones', icon: <Truck className="w-4 h-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { key: 'integrations', label: 'Integrations', icon: <CreditCard className="w-4 h-4" /> },
  ]

  const updateZone = (id: string, field: keyof DeliveryZone, value: string | number | boolean) => {
    setSettings((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        deliveryZones: prev.deliveryZones.map((z) =>
          z.id === id ? { ...z, [field]: value } : z
        ),
      }
    })
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/30 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-danger" />
          <p className="text-sm text-brand-danger">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Settings</h1>
          <p className="text-brand-muted text-sm mt-1">Configure your store</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
            saved
              ? 'bg-brand-success text-white'
              : 'bg-brand-gold text-brand-bg hover:bg-brand-gold-hover',
            saving && 'opacity-70 cursor-not-allowed'
          )}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-brand-gold-muted text-brand-gold'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface-hover'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="settings-panel flex-1 bg-brand-surface rounded-xl border border-brand-border p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-brand-text">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Site Name</label>
                  <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Currency</label>
                  <input type="text" value={settings.currency} className="form-input" disabled />
                  <p className="text-xs text-brand-muted mt-1">Fixed to LKR for Sri Lanka</p>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Site Description</label>
                  <textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} className="form-input min-h-20 resize-none" />
                </div>
                <div>
                  <label className="form-label">Owner Email</label>
                  <input type="email" value={settings.ownerEmail} onChange={(e) => setSettings({ ...settings, ownerEmail: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Owner Phone</label>
                  <input type="text" value={settings.ownerPhone} onChange={(e) => setSettings({ ...settings, ownerPhone: e.target.value })} className="form-input" />
                </div>
              </div>

              <hr className="border-brand-border" />

              <div>
                <h3 className="text-sm font-semibold text-brand-text mb-4">Social Links</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">TikTok</label>
                    <input type="url" value={settings.socialLinks.tiktok || ''} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, tiktok: e.target.value } })} className="form-input" placeholder="https://www.tiktok.com/@..." />
                  </div>
                  <div>
                    <label className="form-label">Instagram</label>
                    <input type="url" value={settings.socialLinks.instagram || ''} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })} className="form-input" placeholder="https://www.instagram.com/..." />
                  </div>
                  <div>
                    <label className="form-label">Facebook</label>
                    <input type="url" value={settings.socialLinks.facebook || ''} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })} className="form-input" placeholder="https://www.facebook.com/..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Zones Tab */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-brand-text">Delivery Zones & COD Fees</h2>
                  <p className="text-sm text-brand-muted mt-1">Configure delivery areas and fees</p>
                </div>
                <button
                  onClick={() => setShowAddZoneModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-border-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Zone
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-brand-bg rounded-lg border border-brand-border">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={handleToggleCOD}
                    className={cn(
                      'w-10 h-6 rounded-full relative transition-colors',
                      settings.codEnabled ? 'bg-brand-gold' : 'bg-brand-border'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all',
                      settings.codEnabled ? 'left-4.5' : 'left-0.5'
                    )} />
                  </div>
                  <span className="text-sm text-brand-text">Cash on Delivery Enabled</span>
                </label>
              </div>

              <div className="space-y-3">
                {settings.deliveryZones.map((zone) => (
                  <div key={zone.id} className="flex items-center gap-4 p-4 bg-brand-bg rounded-lg border border-brand-border">
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <div
                        onClick={() => handleToggleZone(zone.id)}
                        className={cn(
                          'w-8 h-5 rounded-full relative transition-colors',
                          zone.isActive ? 'bg-brand-success' : 'bg-brand-border'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all',
                          zone.isActive ? 'left-3.5' : 'left-0.5'
                        )} />
                      </div>
                    </label>
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                      className="form-input flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-brand-muted">LKR</span>
                      <input
                        type="number"
                        value={zone.fee}
                        onChange={(e) => updateZone(zone.id, 'fee', Number(e.target.value))}
                        className="form-input w-24 text-right"
                      />
                    </div>
                    <button
                      onClick={() => setDeleteZoneId(zone.id)}
                      className="p-2 rounded text-brand-muted hover:text-brand-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-brand-text">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'newOrderEmail' as const, label: 'New order email to owner', description: 'Receive an email alert when a new order is placed' },
                  { key: 'orderConfirmation' as const, label: 'Order confirmation to customer', description: 'Send a confirmation email to the customer after checkout' },
                  { key: 'orderStatusUpdates' as const, label: 'Order status updates', description: 'Notify customers when their order status changes' },
                  { key: 'lowStockAlerts' as const, label: 'Low stock alerts', description: 'Receive alerts when product stock falls below threshold' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-brand-bg rounded-lg border border-brand-border">
                    <div>
                      <p className="text-sm font-medium text-brand-text">{item.label}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{item.description}</p>
                    </div>
                    <div
                      onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={cn(
                        'w-10 h-6 rounded-full relative transition-colors cursor-pointer',
                        notifications[item.key] ? 'bg-brand-gold' : 'bg-brand-border'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all',
                        notifications[item.key] ? 'left-4.5' : 'left-0.5'
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-brand-text">Pixel & Analytics Integrations</h2>
              <div className="space-y-5">
                <div className="p-5 bg-brand-bg rounded-lg border border-brand-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-[#1877F2]/15 flex items-center justify-center">
                      <span className="text-[#1877F2] font-bold text-sm">f</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-brand-text">Meta / Facebook Pixel</h3>
                      <p className="text-xs text-brand-muted">Track PageView, AddToCart, Purchase events</p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Pixel ID</label>
                    <input type="text" value={settings.metaPixelId || ''} onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })} className="form-input font-mono" placeholder="Enter your Meta Pixel ID" />
                  </div>
                </div>

                <div className="p-5 bg-brand-bg rounded-lg border border-brand-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-brand-text">TikTok Pixel</h3>
                      <p className="text-xs text-brand-muted">Track conversions from TikTok ad campaigns</p>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Pixel ID</label>
                    <input type="text" value={settings.tiktokPixelId || ''} onChange={(e) => setSettings({ ...settings, tiktokPixelId: e.target.value })} className="form-input font-mono" placeholder="Enter your TikTok Pixel ID" />
                  </div>
                </div>

                <div className="p-5 bg-brand-bg rounded-lg border border-brand-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-brand-gold/15 flex items-center justify-center">
                      <SettingsIcon className="w-4 h-4 text-brand-gold" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-brand-text">Resend (Email)</h3>
                      <p className="text-xs text-brand-muted">Transactional email service for order notifications</p>
                    </div>
                  </div>
                  <p className="text-xs text-brand-muted">
                    Configured via environment variable <code className="font-mono text-brand-gold">RESEND_API_KEY</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Zone Modal */}
      {showAddZoneModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAddZoneModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-4">Add Delivery Zone</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Zone Name</label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Colombo, Galle"
                  />
                </div>
                <div>
                  <label className="form-label">Delivery Fee (LKR)</label>
                  <input
                    type="number"
                    value={newZoneFee}
                    onChange={(e) => setNewZoneFee(Number(e.target.value))}
                    className="form-input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddZoneModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddZone}
                  disabled={isAddingZone || !newZoneName.trim()}
                  className="flex-1 py-2.5 bg-brand-gold text-brand-bg rounded-lg text-sm font-medium hover:bg-brand-gold-hover transition-colors disabled:opacity-50"
                >
                  {isAddingZone ? 'Adding...' : 'Add Zone'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Zone Confirmation Modal */}
      {deleteZoneId && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setDeleteZoneId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-[448px] p-6">
              <h2 className="text-lg font-semibold text-brand-text mb-2">Delete Delivery Zone?</h2>
              <p className="text-sm text-brand-muted mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteZoneId(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-brand-border text-brand-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteZoneId && handleDeleteZone(deleteZoneId)}
                  className="flex-1 py-2.5 bg-brand-danger text-white rounded-lg text-sm font-medium hover:bg-brand-danger/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

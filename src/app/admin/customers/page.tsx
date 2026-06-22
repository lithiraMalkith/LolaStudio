'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { formatPrice } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { fetchCustomers, updateCustomer, deleteCustomer } from '@/lib/admin-client'
import { Search, Users, Phone, Mail, MapPin, ShoppingCart, Star, Edit, Trash2 } from 'lucide-react'
import type { Customer, VerificationStatus } from '@/types'
import { Modal } from '@/components/modal'

export default function CustomersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, role } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [editForm, setEditForm] = useState<Partial<Customer>>({})

  const handleOpenModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      verificationStatus: customer.verificationStatus || 'unverified',
    })
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setSelectedCustomer(null)
      setIsEditing(false)
    }, 200)
  }

  const handleSaveCustomer = async () => {
    if (!user || !selectedCustomer) return
    setIsSaving(true)
    try {
      const token = await user.getIdToken()
      await updateCustomer(token, selectedCustomer.id, editForm)
      
      // Optimistic update
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, ...editForm } : c))
      )
      handleCloseModal()
    } catch (error) {
      console.error('Failed to update customer:', error)
      alert('Failed to update customer. Are you a super admin?')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!user || !selectedCustomer) return
    if (!confirm(`Are you sure you want to permanently delete customer ${selectedCustomer.name}?`)) return
    
    setIsSaving(true)
    try {
      const token = await user.getIdToken()
      await deleteCustomer(token, selectedCustomer.id)
      
      // Optimistic update
      setCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id))
      handleCloseModal()
    } catch (error) {
      console.error('Failed to delete customer:', error)
      alert('Failed to delete customer. Are you a super admin?')
    } finally {
      setIsSaving(false)
    }
  }

  useGSAP(() => {
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' })
    const cards = document.querySelectorAll('.customer-card')
    if (cards.length > 0) {
      gsap.from('.customer-card', { opacity: 0, y: 20, stagger: 0.06, duration: 0.5, ease: 'power3.out', delay: 0.2 })
    }
  }, { scope: containerRef })

  useEffect(() => {
    const loadCustomers = async () => {
      if (!user) return
      setLoading(true)

      try {
        const token = await user.getIdToken()
        const rawCustomers = await fetchCustomers(token)
        setCustomers(
          rawCustomers.map((customer) => ({
            ...customer,
            createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
            lastOrderAt: customer.lastOrderAt ? new Date(customer.lastOrderAt) : undefined,
          }))
        )
      } catch (error) {
        console.error('Failed to load customers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [user])

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Customers</h1>
          <p className="text-brand-muted text-sm mt-1">{customers.length} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-[448px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
        <input type="text" placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((customer) => (
          <div key={customer.id} className="customer-card bg-brand-surface rounded-xl border border-brand-border p-5 card-hover relative group">
            <button 
              onClick={() => handleOpenModal(customer)}
              className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-text bg-brand-background/50 hover:bg-brand-background rounded-full transition-all opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Manage Customer"
            >
              <Edit className="w-4 h-4" />
            </button>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center">
                  <span className="text-brand-gold font-medium text-sm">{customer.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <p className="font-medium text-brand-text flex items-center gap-1.5">
                    {customer.name}
                    {customer.isRepeat && <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {customer.isRepeat ? 'Repeat Customer' : 'New Customer'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-brand-muted">
                <Mail className="w-3.5 h-3.5" />
                <span className="text-brand-text-secondary">{customer.email}</span>
              </p>
              <p className="flex items-center gap-2 text-brand-muted">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-brand-text-secondary">{customer.phone}</span>
              </p>
              {customer.address && (
                <p className="flex items-center gap-2 text-brand-muted">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-brand-text-secondary">{customer.address.city}, {customer.address.district}</span>
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-brand-border/50">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-brand-muted" />
                <span className="text-xs text-brand-muted">{customer.orderCount} orders</span>
              </div>
              <span className="text-sm font-medium text-brand-gold">{formatPrice(customer.totalSpent)}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-brand-muted mx-auto mb-3" />
          <p className="text-brand-muted">No customers found</p>
        </div>
      )}

      {/* Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditing ? 'Edit Customer' : 'Customer Details'}
        actions={
          isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-brand-gold text-black rounded-lg hover:bg-brand-gold/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {role === 'superadmin' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium bg-brand-border/50 text-brand-text hover:bg-brand-border rounded-lg transition-colors"
              >
                Close
              </button>
            </>
          )
        }
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {!isEditing ? (
              // VIEW MODE
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-gold/15 flex items-center justify-center">
                    <span className="text-brand-gold font-medium text-xl">
                      {selectedCustomer.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-brand-text flex items-center gap-2">
                      {selectedCustomer.name}
                      {selectedCustomer.isRepeat && <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />}
                    </h3>
                    <p className="text-sm text-brand-muted capitalize">
                      {selectedCustomer.verificationStatus || 'unverified'} Customer
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-brand-border/50">
                  <div>
                    <p className="text-xs text-brand-muted mb-1">Total Orders</p>
                    <p className="font-medium text-brand-text">{selectedCustomer.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted mb-1">Total Spent</p>
                    <p className="font-medium text-brand-gold">{formatPrice(selectedCustomer.totalSpent)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-brand-muted" />
                    <span className="text-brand-text-secondary">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-brand-muted" />
                    <span className="text-brand-text-secondary">{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-brand-muted mt-0.5" />
                      <span className="text-brand-text-secondary">
                        {selectedCustomer.address.addressLine1}
                        {selectedCustomer.address.addressLine2 && <br />}
                        {selectedCustomer.address.addressLine2}
                        <br />
                        {selectedCustomer.address.city}, {selectedCustomer.address.district}
                        <br />
                        {selectedCustomer.address.postalCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // EDIT MODE
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-brand-muted">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-brand-muted">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-brand-muted">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-brand-muted">Verification Status</label>
                  <select
                    value={editForm.verificationStatus || 'unverified'}
                    onChange={(e) => setEditForm({ ...editForm, verificationStatus: e.target.value as VerificationStatus })}
                    className="w-full bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-gold transition-colors appearance-none"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="verified">Verified</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {role === 'superadmin' && (
                  <div className="pt-6 border-t border-brand-border/50">
                    <button
                      onClick={handleDeleteCustomer}
                      disabled={isSaving}
                      className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Customer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

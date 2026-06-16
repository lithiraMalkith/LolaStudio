'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { formatPrice } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { fetchCustomers } from '@/lib/admin-client'
import { Search, Users, Phone, Mail, MapPin, ShoppingCart, Star } from 'lucide-react'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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
          <div key={customer.id} className="customer-card bg-brand-surface rounded-xl border border-brand-border p-5 card-hover">
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
    </div>
  )
}

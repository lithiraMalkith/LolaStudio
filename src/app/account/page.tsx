'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth'
import app from '@/lib/firebase'

interface Order {
  id: string
  customerInfo: {
    name: string
    email: string
    address: string
  }
  items: any[]
  total: number
  status: string
  createdAt: string
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (data.success) {
        await user.reload()
        const auth = getAuth(app)
        // Force state update by creating a new reference or spreading, but User is a complex object.
        // Actually, onAuthStateChanged should catch it, or we can just update the fields manually.
        // We'll update the user state manually to ensure UI reflects immediately.
        setUser(auth.currentUser ? Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser) : null)
        setIsEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (err: any) {
      alert('An error occurred while updating profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = () => {
    setEditForm({
      displayName: user?.displayName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || ''
    })
    setIsEditing(true)
  }

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        try {
          const token = await user.getIdToken()
          const res = await fetch('/api/user/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          if (data.success) {
            setOrders(data.data)
          }
        } catch (err) {
          console.error("Error fetching orders:", err)
        }
      } else {
        router.push('/login')
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    const auth = getAuth(app)
    await signOut(auth)
    router.push('/')
  }

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen pt-[120px] flex items-center justify-center">
          <div className="animate-pulse bg-surface-container w-16 h-16 rounded-full"></div>
        </div>
      </StorefrontLayout>
    )
  }

  if (!user) return null

  return (
    <StorefrontLayout>
      <div className="pt-[110px] min-h-screen">
        {/* Hero Spiritual Minimalist Header */}
        <section className="w-full py-xl px-gutter flex flex-col items-center text-center">
          <div className="mb-sm opacity-60 font-label-sm text-[10px] tracking-[0.3em] uppercase">Identity & Collection</div>
          <h2 className="font-headline-xl text-[36px] mb-md text-on-surface tracking-tight uppercase">My Sanctuary</h2>
          <div className="w-12 h-[1px] bg-primary-container mb-md"></div>
          <p className="font-caption text-[11px] text-on-surface-variant max-w-[576px] opacity-80 uppercase tracking-widest leading-relaxed">
            A personal space dedicated to your journey through handmade artisanal luxury and spiritual connection.
          </p>
        </section>

        {/* Main Dashboard Content */}
        <section className="max-w-container-max mx-auto px-gutter pb-xl grid grid-cols-1 md:grid-cols-12 gap-lg items-start">
          
          {/* Left Column: Personal Identity */}
          <aside className="md:col-span-4 space-y-lg md:sticky md:top-[120px]">
            <div className="bg-surface-container-low p-md border border-outline-variant relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-end justify-between mb-lg">
                  <h3 className="font-body-lg text-[18px] text-on-surface uppercase tracking-widest">Identity</h3>
                  {!isEditing ? (
                    <button onClick={startEditing} className="font-label-sm text-[10px] text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                    </button>
                  ) : (
                    <span className="font-label-sm text-[10px] text-primary opacity-50 uppercase tracking-widest">Editing</span>
                  )}
                </div>
                
                <div className="space-y-md">
                  <div className="group/input">
                    <label className="block font-label-sm text-[10px] text-on-surface-variant uppercase mb-xs tracking-widest">Soul Name</label>
                    <div className="border-b border-outline-variant py-xs group-focus-within/input:border-primary transition-colors flex justify-between items-center">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.displayName} 
                          onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                          className="bg-transparent border-none outline-none font-body-lg text-[15px] text-on-surface w-full"
                          placeholder="Artisan Soul"
                        />
                      ) : (
                        <span className="font-body-lg text-[15px] text-on-surface">{user.displayName || 'Artisan Soul'}</span>
                      )}
                    </div>
                  </div>
                  <div className="group/input">
                    <label className="block font-label-sm text-[10px] text-on-surface-variant uppercase mb-xs tracking-widest">Email Resonance</label>
                    <div className="border-b border-outline-variant py-xs group-focus-within/input:border-primary transition-colors flex justify-between items-center">
                      {isEditing ? (
                        <input 
                          type="email" 
                          value={editForm.email} 
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="bg-transparent border-none outline-none font-body-lg text-[15px] text-on-surface w-full"
                          placeholder="soul@example.com"
                        />
                      ) : (
                        <span className="font-body-lg text-[15px] text-on-surface">{user.email}</span>
                      )}
                    </div>
                  </div>
                  <div className="group/input">
                    <label className="block font-label-sm text-[10px] text-on-surface-variant uppercase mb-xs tracking-widest">Mobile Resonance</label>
                    <div className="border-b border-outline-variant py-xs group-focus-within/input:border-primary transition-colors flex justify-between items-center">
                      {isEditing ? (
                        <input 
                          type="tel" 
                          value={editForm.phoneNumber} 
                          onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                          className="bg-transparent border-none outline-none font-body-lg text-[15px] text-on-surface w-full"
                          placeholder="+94771234567"
                        />
                      ) : (
                        <span className="font-body-lg text-[15px] text-on-surface">{user.phoneNumber || 'Not provided'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-md flex gap-sm">
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="flex-1 py-sm border border-outline-variant text-on-surface-variant font-label-sm uppercase tracking-widest hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 py-sm bg-primary text-on-primary font-label-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}

                <div className="mt-xl pt-md border-t border-outline-variant flex gap-sm">
                  <button 
                    onClick={handleSignOut}
                    className="border border-primary text-primary px-md py-sm font-label-sm text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all w-full"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Subtle Decorative Card */}
            <div className="bg-surface-container-lowest p-md border border-outline-variant relative overflow-hidden h-64 flex flex-col justify-end">
              <img 
                alt="Sri Lankan Ceramic" 
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 mix-blend-luminosity" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpvP3yWw5zmPKOCZFiSFu7pWEHW5il2vbYK7v1O6eHuFdkO00qFSWveZ-N3JBQbT3aaFI-z6EqDNdP9H9-PCpVc-_5vzW1Yau1dLf-nMzVibin_ZNOTvPM48M2a870XTlV7aT7SiViWZlRb2KYrN6tMwxJ5GMEOOLpHC8aIgUPAm39w8w3aNvCAZVLB9LGfVxyuasc4Kjq89PmV9GoVPkI3pt1Z5DDsrCSYC0iKgOqjSED-wGcChYx6stXZjIabrpzGnoCquTtXmSh" 
              />
              <div className="relative z-10 text-on-surface">
                <div className="font-label-sm text-[10px] uppercase tracking-widest opacity-60 mb-xs">Spiritual Essence</div>
                <h4 className="font-headline-md text-[24px] italic">Curation Philosophy</h4>
                <p className="font-caption text-[11px] text-on-surface-variant mt-xs tracking-widest uppercase">Each piece in your collection is hand-carved in Sri Lanka.</p>
              </div>
            </div>
          </aside>

          {/* Right Column: Curation History (Orders) */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-lg">
              <div className="flex items-baseline gap-sm">
                <h3 className="font-body-lg text-[18px] text-on-surface uppercase tracking-widest">Curation History</h3>
                <span className="font-label-sm text-[11px] text-on-surface-variant opacity-40">({orders.length.toString().padStart(2, '0')})</span>
              </div>
            </div>

            {/* Orders Table-like Grid */}
            <div className="space-y-sm">
              {orders.length === 0 ? (
                <div className="p-xl border border-outline-variant text-center bg-surface-container-low">
                  <p className="font-caption text-[12px] text-on-surface-variant uppercase tracking-widest">No curations manifested yet.</p>
                </div>
              ) : (
                orders.map((order, i) => (
                  <div key={order.id} className="bg-surface-container-low border border-outline-variant flex flex-col md:flex-row md:items-center p-md group hover:bg-surface-container-high transition-all duration-500">
                    <div className="w-24 h-24 bg-background border border-outline-variant shrink-0 mb-md md:mb-0 md:mr-md overflow-hidden flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary transition-colors">card_giftcard</span>
                    </div>
                    <div className="flex-1 flex flex-col md:grid md:grid-cols-4 gap-sm md:gap-md md:items-center w-full">
                      <div className="md:col-span-2 flex justify-between items-start md:block">
                        <div>
                          <div className="font-label-sm text-[10px] uppercase tracking-widest text-primary mb-xs">Order #{order.id.slice(-8)}</div>
                          <h5 className="font-headline-md text-[18px] text-on-surface leading-tight uppercase">{order.items ? order.items.length : 0} Artifact{order.items && order.items.length !== 1 ? 's' : ''}</h5>
                          <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">Initiated {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        {/* Status for Mobile */}
                        <div className="md:hidden mt-1">
                          <div className={`flex items-center gap-xs font-label-sm text-[10px] uppercase tracking-widest ${order.status === 'pending' ? 'text-primary-container' : 'text-on-surface'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'pending' ? 'bg-primary-container animate-pulse' : 'bg-primary'}`}></span> 
                            {order.status}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <div className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant mb-xs">Status</div>
                        <div className={`flex items-center gap-xs font-label-sm text-[11px] uppercase tracking-widest ${order.status === 'pending' ? 'text-primary-container' : 'text-on-surface'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'pending' ? 'bg-primary-container animate-pulse' : 'bg-primary'}`}></span> 
                          {order.status}
                        </div>
                      </div>
                      <div className="flex justify-between items-center md:block md:text-right mt-xs md:mt-0 pt-sm md:pt-0 border-t border-outline-variant md:border-0">
                        <div className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant md:mb-xs">Value</div>
                        <div className="font-headline-md text-[15px] md:text-[14px] text-on-surface font-medium">${order.total.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Loyalty / Sanctuary Points Section */}
            <div className="mt-lg border border-outline-variant p-md flex flex-col md:flex-row justify-between items-center bg-surface-container-lowest text-center md:text-left">
              <div className="mb-md md:mb-0">
                <h6 className="font-body-lg text-[15px] text-primary uppercase tracking-widest">Artisan Legacy</h6>
                <p className="font-body-md text-[13px] text-on-surface-variant uppercase tracking-widest">You have curated {orders.length} unique stories.</p>
              </div>
              <div className="flex gap-md">
                <div className="text-center">
                  <div className="font-label-sm text-[10px] text-primary uppercase tracking-widest">Sanctuary Tier</div>
                  <div className="font-headline-xl text-[24px] text-on-surface uppercase">GOLD</div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </StorefrontLayout>
  )
}

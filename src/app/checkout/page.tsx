'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import app from '@/lib/firebase'
import { formatPrice } from '@/lib/utils'

interface CartItem {
  id: string
  productId: string
  quantity: number
}

interface EnrichedCartItem extends CartItem {
  product: {
    name: string
    images: string[]
    price: number
    category?: string
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [cartItems, setCartItems] = useState<EnrichedCartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod')

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    phone: ''
  })

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const token = await user.getIdToken()

          // Fetch user profile for autofill
          const profileRes = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const profileData = await profileRes.json()
          if (profileData.success && profileData.data) {
            const data = profileData.data
            const nameParts = (data.displayName || '').split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            setShippingInfo(prev => ({
              ...prev,
              firstName: prev.firstName || firstName,
              lastName: prev.lastName || lastName,
              address: prev.address || data.address || '',
              phone: prev.phone || data.phoneNumber || ''
            }))
          }

          // Fetch cart
          const res = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()

          if (data.success && data.data) {
            const items = await Promise.all(data.data.map(async (item: any) => {
              const pRes = await fetch(`/api/products/${item.productId}`)
              const pData = await pRes.json()
              return {
                ...item,
                product: pData.success ? pData.data : { name: 'Unknown Product', price: 0, images: [] }
              }
            }))
            setCartItems(items)
          }
        } catch (err) {
          console.error("Error fetching data:", err)
        }
      } else {
        router.push('/login')
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const logistics = cartItems.length > 0 ? 45 : 0
  const tax = subtotal * 0.05 // 5% tax example
  const total = subtotal + logistics + tax

  const handleCompleteOrder = async () => {
    if (!user) return
    if (!shippingInfo.firstName || !shippingInfo.address || !shippingInfo.phone) {
      alert("Please fill in required shipping fields.")
      return
    }

    setIsSubmitting(true)
    try {
      const token = await user.getIdToken()

      const payload = {
        customerInfo: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          email: user.email,
          phone: shippingInfo.phone,
          addressLine1: shippingInfo.address,
          city: shippingInfo.city,
          district: 'Colombo', // Required by schema
          postalCode: '10000'  // Required by schema
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price
        })),
        paymentMethod: paymentMethod,
        subtotal,
        deliveryFee: logistics,
        total
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        alert("Order placed successfully! Redirecting to account...")
        router.push('/account')
      } else {
        alert("Failed to place order: " + data.error)
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred during checkout.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-pulse bg-surface-container w-16 h-16 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Header Navigation Shell */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-gutter h-xl border-b border-outline-variant">
        <Link href="/" className="font-label-sm text-[16px] text-primary tracking-[0.2em] uppercase transition-all duration-500 hover:tracking-[0.3em]">
          LOLA STUDIO
        </Link>
        <div className="flex items-center gap-gutter">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest hidden md:inline">Secure Checkout</span>
          <span className="material-symbols-outlined text-primary" data-icon="lock">lock</span>
        </div>
      </header>

      <main className="pt-[120px] pb-xl px-gutter max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">

          {/* Left Column: Shipping & Payment */}
          <div className="lg:col-span-7 space-y-xl">
            {/* Section: Shipping Information */}
            <section className="space-y-lg">
              <div className="flex items-center gap-md border-b border-outline-variant pb-base">
                <span className="font-label-sm text-[11px] bg-primary-container text-on-primary-container w-6 h-6 flex items-center justify-center rounded-full">1</span>
                <h2 className="font-headline-md text-[18px] text-on-surface uppercase tracking-tight">Shipping Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-gutter">
                <div className="col-span-1">
                  <label className="block font-label-sm text-[11px] text-on-surface-variant uppercase mb-xs tracking-widest">First Name</label>
                  <input
                    value={shippingInfo.firstName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-sm font-body-md text-on-surface transition-colors focus:border-primary focus:ring-0 px-0"
                    type="text"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-label-sm text-[11px] text-on-surface-variant uppercase mb-xs tracking-widest">Last Name</label>
                  <input
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-sm font-body-md text-on-surface transition-colors focus:border-primary focus:ring-0 px-0"
                    type="text"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-label-sm text-[11px] text-on-surface-variant uppercase mb-xs tracking-widest">Address</label>
                  <input
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-sm font-body-md text-on-surface transition-colors focus:border-primary focus:ring-0 px-0"
                    placeholder="Street name and house number"
                    type="text"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-label-sm text-[11px] text-on-surface-variant uppercase mb-xs tracking-widest">City</label>
                  <input
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-sm font-body-md text-on-surface transition-colors focus:border-primary focus:ring-0 px-0"
                    type="text"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-label-sm text-[11px] text-on-surface-variant uppercase mb-xs tracking-widest">Phone</label>
                  <input
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-sm font-body-md text-on-surface transition-colors focus:border-primary focus:ring-0 px-0"
                    placeholder="+94 XX XXX XXXX"
                    type="tel"
                  />
                </div>
              </div>
            </section>

            {/* Section: Payment Method */}
            <section className="space-y-lg">
              <div className="flex items-center gap-md border-b border-outline-variant pb-base">
                <span className="font-label-sm text-[11px] bg-primary-container text-on-primary-container w-6 h-6 flex items-center justify-center rounded-full">2</span>
                <h2 className="font-headline-md text-[18px] text-on-surface uppercase tracking-tight">Payment Method</h2>
              </div>

              <div className="space-y-md">
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`group cursor-pointer border p-lg flex items-center justify-between transition-all duration-500 ${paymentMethod === 'cod' ? 'border-primary bg-surface-container-high' : 'border-outline-variant hover:border-outline'}`}
                >
                  <div className="flex items-center gap-md">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-primary' : 'border-outline-variant'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${paymentMethod === 'cod' ? 'bg-primary' : 'bg-transparent'}`}></div>
                    </div>
                    <div>
                      <h3 className={`font-body-lg font-bold uppercase ${paymentMethod === 'cod' ? 'text-primary' : 'text-on-surface'}`}>Cash on Delivery</h3>
                      <p className="font-caption text-[12px] text-on-surface-variant">Pay in cash upon delivery to your doorstep.</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-3xl ${paymentMethod === 'cod' ? 'text-primary' : 'text-on-surface-variant'}`} data-icon="payments">payments</span>
                </div>


              </div>
            </section>

            <button
              onClick={handleCompleteOrder}
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full py-md bg-primary text-on-primary font-label-sm text-[11px] uppercase tracking-widest transition-all duration-500 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Complete Order'}
            </button>
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <aside className="lg:col-span-5 relative">
            <div className="sticky top-[120px] bg-surface-container p-lg space-y-lg border border-outline-variant">
              <h2 className="font-label-sm text-[14px] text-on-surface uppercase border-b border-outline-variant pb-base tracking-widest">Order Summary</h2>

              {/* Product List */}
              <div className="space-y-md max-h-[400px] overflow-y-auto custom-scrollbar pr-base">
                {cartItems.map((item, index) => (
                  <div key={item.id} className={`flex gap-md ${index > 0 ? 'border-t border-outline-variant pt-md' : ''}`}>
                    <div className="w-24 h-32 flex-shrink-0 bg-surface-container-lowest overflow-hidden">
                      <img
                        src={item.product.images?.[0] || 'https://via.placeholder.com/150'}
                        alt={item.product.name}
                        className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
                      />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-xs">
                      <div>
                        <h4 className="font-label-sm text-[14px] uppercase text-primary tracking-wider">{item.product.name}</h4>
                        <p className="font-caption text-[12px] text-on-surface-variant">{item.product.category || 'Handmade Artifact'}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="font-caption text-[12px] text-on-surface-variant">Qty: {item.quantity}</span>
                        <span className="font-body-md text-[14px] font-bold text-on-surface">{formatPrice(item.product.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-sm pt-md border-t border-outline-variant">
                <div className="flex justify-between font-caption text-[12px] text-on-surface-variant uppercase tracking-wider">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between font-caption text-[12px] text-on-surface-variant uppercase tracking-wider">
                  <span>Shipping</span>
                  <span>{formatPrice(logistics)}</span>
                </div>
                <div className="flex justify-between font-caption text-[12px] text-on-surface-variant uppercase tracking-wider">
                  <span>Taxes</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between font-body-lg text-[18px] font-bold text-primary uppercase pt-base border-t border-outline-variant">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>


            </div>
          </aside>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl px-gutter flex flex-col items-center gap-md bg-surface-container-lowest border-t border-outline-variant mt-xl">
        <div className="font-label-sm text-primary tracking-[0.2em] uppercase text-[16px]">LOLA STUDIO</div>
        <div className="flex gap-lg flex-wrap justify-center">
          <Link className="font-caption text-[12px] text-on-tertiary-container hover:text-primary transition-colors duration-300 uppercase tracking-widest" href="#">Shipping & Logistics</Link>
          <Link className="font-caption text-[12px] text-on-tertiary-container hover:text-primary transition-colors duration-300 uppercase tracking-widest" href="#">Returns Policy</Link>
          <Link className="font-caption text-[12px] text-on-tertiary-container hover:text-primary transition-colors duration-300 uppercase tracking-widest" href="#">The Artisan Story</Link>
          <Link className="font-caption text-[12px] text-on-tertiary-container hover:text-primary transition-colors duration-300 uppercase tracking-widest" href="#">Privacy</Link>
        </div>
        <p className="font-caption text-[12px] text-on-tertiary-container opacity-60">© 2026 LOLA STUDIO. HANDMADE IN SRI LANKA.</p>
      </footer>
    </div>
  )
}

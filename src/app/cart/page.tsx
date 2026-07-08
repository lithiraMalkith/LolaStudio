'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import app from '@/lib/firebase'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/contexts/cart-context'

interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number // we will fetch product details to get price if needed, but our GET /api/cart might return enriched items.
  // Wait, my GET /api/cart does not enrich items with product details. Let me enrich it here or on the server.
  // I will just fetch product details in the client for each item.
}

interface EnrichedCartItem extends CartItem {
  product: {
    name: string
    images: string[]
    price: number
    category?: string
  }
}

export default function CartPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [cartItems, setCartItems] = useState<EnrichedCartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { refreshCart } = useCart()

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const token = await user.getIdToken()
          const res = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()

          if (data.success && data.data) {
            // Enrich with product details
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
          console.error("Error fetching cart:", err)
        }
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const removeItem = async (itemId: string) => {
    if (!user) return
    const token = await user.getIdToken()
    try {
      const res = await fetch(`/api/cart?productId=${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setCartItems(prev => prev.filter(item => item.id !== itemId))
        await refreshCart()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const logistics = cartItems.length > 0 ? 45 : 0
  const total = subtotal + logistics

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex items-center justify-center pt-[120px]">
          <div className="animate-pulse bg-surface-container w-16 h-16 rounded-full"></div>
        </div>
      </StorefrontLayout>
    )
  }

  if (!user) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-md pt-[120px]">
          <h2 className="font-headline-xl text-[32px] text-on-surface">Please Login</h2>
          <p className="font-body-md text-on-surface-variant">You must be logged in to view your sanctuary selections.</p>
          <Link href="/login" className="px-lg py-sm bg-primary text-on-primary font-label-sm uppercase tracking-widest mt-md">
            Login
          </Link>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <div className="pt-[120px] pb-xl px-gutter max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-xl">
          {/* Left Column: Artisanal Acquisitions */}
          <div className="md:col-span-8 flex flex-col gap-lg">
            <div className="flex flex-col gap-xs mb-md">
              <span className="font-label-sm text-[11px] text-primary uppercase">Your Selection</span>
              <h2 className="font-headline-md text-[32px] text-on-background">ARTISANAL ACQUISITIONS</h2>
            </div>

            {/* Product List */}
            <div className="flex flex-col border-t border-outline-variant">
              {cartItems.length === 0 ? (
                <p className="py-xl text-center text-on-surface-variant font-caption uppercase tracking-widest">Your selection is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row py-lg gap-md border-b border-outline-variant group">
                    <div className="w-full md:w-48 aspect-[3/4] bg-surface-container-low overflow-hidden">
                      <img
                        src={item.product.images?.[0] || 'https://via.placeholder.com/150'}
                        alt={item.product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-body-lg text-[16px] mb-xs text-on-surface uppercase tracking-[0.1em]">{item.product.name}</h3>
                          <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-widest">
                            {item.product.category || 'Handmade Artifact'}
                          </p>
                        </div>
                        <span className="font-body-lg text-[16px] text-primary">{formatPrice(item.product.price)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-lg">
                        <div className="flex items-center gap-md border border-outline-variant px-md py-xs">
                          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">QTY</span>
                          <span className="font-label-sm text-[11px] w-8 text-center">{item.quantity.toString().padStart(2, '0')}</span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="font-label-sm text-[11px] text-on-surface-variant hover:text-error transition-colors uppercase tracking-widest gold-underline-hover"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Shipping Note */}
            <div className="p-lg bg-surface-container-low flex items-start gap-md mt-lg">
              <span className="material-symbols-outlined text-primary mt-1">info</span>
              <div>
                <p className="font-label-sm text-[11px] text-on-surface uppercase mb-xs">International Fulfillment</p>
                <p className="font-caption text-[12px] text-on-surface-variant">Your acquisitions are being meticulously prepared by our artisans in Sri Lanka. Please allow 14-21 business days for international delivery of these handmade goods.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="md:col-span-4">
            <div className="sticky top-[120px] flex flex-col gap-lg bg-surface-container p-lg border border-outline-variant">
              <div className="flex flex-col gap-xs">
                <span className="font-label-sm text-[11px] text-primary uppercase">Financials</span>
                <h3 className="font-body-lg text-[16px] text-on-surface uppercase tracking-widest">ORDER SUMMARY</h3>
              </div>

              <div className="flex flex-col gap-md py-md border-y border-outline-variant">
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">Subtotal</span>
                  <span className="font-body-md text-[14px] text-on-surface">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">Logistics</span>
                  <span className="font-body-md text-[14px] text-on-surface">{formatPrice(logistics)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">Tax</span>
                  <span className="font-body-md text-[14px] text-on-surface">LKR 0.00</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">Total Balance</span>
                <span className="font-body-lg text-[16px] text-primary">{formatPrice(total)}</span>
              </div>

              <div className="flex flex-col gap-sm">
                <button
                  onClick={() => cartItems.length > 0 && router.push('/checkout')}
                  disabled={cartItems.length === 0}
                  className="w-full py-md bg-primary text-on-primary font-label-sm text-[11px] uppercase tracking-widest hover:opacity-90 transition-all duration-500 active:scale-95 disabled:opacity-50"
                >
                  Proceed to Checkout
                </button>
                <Link href="/shop" className="w-full py-md bg-transparent border border-primary text-primary font-label-sm text-[11px] uppercase tracking-widest hover:bg-primary/10 transition-all duration-500 active:scale-95 text-center">
                  Continue Browsing
                </Link>
              </div>

              <div className="flex flex-col gap-sm mt-md">
                <p className="font-caption text-[12px] text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">lock</span> Secure Encryption Enabled
                </p>
                <div className="flex gap-md opacity-40">
                  <span className="material-symbols-outlined">credit_card</span>
                  <span className="material-symbols-outlined">payments</span>
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  )
}

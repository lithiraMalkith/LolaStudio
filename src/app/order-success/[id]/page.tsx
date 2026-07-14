'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import app from '@/lib/firebase'
import { formatPrice } from '@/lib/utils'

function getOrderImage(order: any): string {
  const FALLBACK = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpvP3yWw5zmPKOCZFiSFu7pWEHW5il2vbYK7v1O6eHuFdkO00qFSWveZ-N3JBQbT3aaFI-z6EqDNdP9H9-PCpVc-_5vzW1Yau1dLf-nMzVibin_ZNOTvPM48M2a870XTlV7aT7SiViWZlRb2KYrN6tMwxJ5GMEOOLpHC8aIgUPAm39w8w3aNvCAZVLB9LGfVxyuasc4Kjq89PmV9GoVPkI3pt1Z5DDsrCSYC0iKgOqjSED-wGcChYx6stXZjIabrpzGnoCquTtXmSh'
  if (order.image) return order.image
  if (order.items && order.items.length > 0) {
    const first = order.items[0]
    if (!first) return FALLBACK
    if (first.image) return first.image
    if (first.images && Array.isArray(first.images) && first.images.length > 0) return first.images[0]
    if (first.thumbnail) return first.thumbnail
  }
  return FALLBACK
}

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: orderId } = use(params)
  
  const [user, setUser] = useState<User | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const token = await currentUser.getIdToken()
          // Fetch all user orders
          const res = await fetch('/api/user/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          
          if (data.success && data.data) {
            const foundOrder = data.data.find((o: any) => o.id === orderId)
            if (foundOrder) {
              setOrder(foundOrder)
            } else {
              setError("Order not found or doesn't belong to you.")
            }
          } else {
            setError(data.error || "Failed to fetch orders.")
          }
        } catch (err) {
          console.error("Error fetching data:", err)
          setError("An error occurred while fetching order details.")
        }
      } else {
        router.push('/login')
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [router, orderId])

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen pt-[120px] flex items-center justify-center">
          <div className="animate-pulse bg-surface-container w-16 h-16 rounded-full"></div>
        </div>
      </StorefrontLayout>
    )
  }

  if (error || !order) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen pt-[120px] flex flex-col items-center justify-center px-gutter text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-md">error_outline</span>
          <h2 className="font-headline-md text-[24px] text-on-surface uppercase mb-sm">Order Not Found</h2>
          <p className="font-caption text-on-surface-variant uppercase tracking-widest mb-lg">{error}</p>
          <Link href="/shop" className="px-lg py-sm bg-primary text-on-primary font-label-sm uppercase tracking-widest hover:brightness-110 transition-all">
            Return to Shop
          </Link>
        </div>
      </StorefrontLayout>
    )
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <StorefrontLayout>
      <div className="pt-[110px] min-h-screen pb-xl">
        {/* Header section with product image background as requested */}
        <section className="w-full relative py-2xl px-gutter flex flex-col items-center text-center overflow-hidden mb-xl">
          <div className="absolute inset-0 z-0">
             <img 
               src={getOrderImage(order)} 
               alt="Order Background" 
               className="w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-primary-container text-primary flex items-center justify-center mx-auto mb-md gold-glow">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div className="mb-sm text-primary font-label-sm text-[12px] tracking-[0.3em] uppercase">Order Successful</div>
            <h2 className="font-headline-xl text-[36px] mb-md text-on-surface tracking-tight uppercase">Thank You</h2>
            <div className="w-12 h-[1px] bg-primary/40 mb-md mx-auto"></div>
            <p className="font-caption text-[12px] text-on-surface-variant max-w-[576px] opacity-80 uppercase tracking-widest leading-relaxed">
              Your order has been placed. A confirmation email has been sent to {order.customer?.email}.
            </p>
          </div>
        </section>

        {/* Order Details Grid */}
        <section className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-12 gap-xl">
          
          {/* Left Column: Items and Summary */}
          <div className="lg:col-span-7 space-y-lg">
            
            <div className="bg-surface-container-low border border-outline-variant/30 p-lg">
              <h3 className="font-body-lg text-[18px] text-on-surface uppercase tracking-widest mb-lg border-b border-outline-variant/30 pb-sm">
                Order Items
              </h3>
              
              <div className="space-y-md">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-md">
                    <div className="w-20 h-24 bg-surface-container border border-outline-variant/30 overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image || getOrderImage(order)} 
                        alt={item.productName}
                        className="w-full h-full object-cover mix-blend-luminosity opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-label-sm text-[14px] uppercase tracking-wider text-on-surface mb-xs">{item.productName}</h4>
                      <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-body-md text-[15px] font-medium text-primary">{formatPrice(item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/30 p-lg">
              <h3 className="font-body-lg text-[18px] text-on-surface uppercase tracking-widest mb-lg border-b border-outline-variant/30 pb-sm">
                Payment Summary
              </h3>
              
              <div className="space-y-sm">
                <div className="flex justify-between font-caption text-[13px] text-on-surface-variant uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between font-caption text-[13px] text-on-surface-variant uppercase tracking-widest">
                  <span>Shipping</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between items-center font-body-lg text-[16px] text-on-surface uppercase tracking-widest mt-md pt-sm border-t border-outline-variant/30">
                  <span>Total</span>
                  <span className="text-primary font-bold">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Information */}
          <div className="lg:col-span-5 space-y-lg">
            
            <div className="bg-surface-container-low border border-outline-variant/30 p-lg">
              <h3 className="font-body-lg text-[18px] text-on-surface uppercase tracking-widest mb-lg border-b border-outline-variant/30 pb-sm">
                Order Information
              </h3>
              
              <div className="space-y-md">
                <div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">Order Reference</div>
                  <div className="font-body-md text-[15px] text-on-surface uppercase tracking-wider">{order.orderRef}</div>
                </div>
                <div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">Date</div>
                  <div className="font-body-md text-[15px] text-on-surface uppercase tracking-wider">{orderDate}</div>
                </div>
                <div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">Status</div>
                  <div className="inline-flex items-center gap-xs px-sm py-[2px] rounded-sm font-label-sm text-[11px] uppercase tracking-widest bg-surface-container-high text-on-surface">
                    {order.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/30 p-lg">
              <h3 className="font-body-lg text-[18px] text-on-surface uppercase tracking-widest mb-lg border-b border-outline-variant/30 pb-sm">
                Shipping Details
              </h3>
              
              <div className="space-y-md">
                <div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">Customer</div>
                  <div className="font-body-md text-[14px] text-on-surface uppercase tracking-wider">{order.customer?.name}</div>
                  <div className="font-caption text-[12px] text-on-surface-variant">{order.customer?.phone}</div>
                </div>
                <div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">Address</div>
                  <div className="font-caption text-[13px] text-on-surface leading-relaxed max-w-[250px]">
                    {order.deliveryAddress?.addressLine1}<br/>
                    {order.deliveryAddress?.addressLine2 && <>{order.deliveryAddress?.addressLine2}<br/></>}
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.postalCode}<br/>
                    {order.deliveryAddress?.district}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-md">
              <Link 
                href="/shop" 
                className="w-full flex items-center justify-center gap-sm py-md bg-primary text-on-primary font-label-sm text-[11px] uppercase tracking-widest transition-all duration-500 hover:brightness-110 active:scale-[0.98]"
              >
                Browse More Artifacts
              </Link>
              
              <Link 
                href="/account" 
                className="w-full mt-sm flex items-center justify-center gap-sm py-md border border-outline-variant text-on-surface font-label-sm text-[11px] uppercase tracking-widest transition-all duration-500 hover:bg-surface-container"
              >
                View Account Dashboard
              </Link>
            </div>

          </div>
        </section>
      </div>
    </StorefrontLayout>
  )
}

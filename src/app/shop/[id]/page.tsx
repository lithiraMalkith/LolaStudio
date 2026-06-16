'use client'

import { useEffect, useRef, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { getAuth } from 'firebase/auth'
import app from '@/lib/firebase'
import { ImageIcon } from 'lucide-react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category?: string
  subCategory?: string
  slug: string
  description?: string
  dimensions?: string
  material?: string
  color?: string
  weight?: string
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const productId = unwrappedParams.id

  const container = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProduct(data.data)
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch product', err)
        setIsLoading(false)
      })
  }, [productId])

  useGSAP(() => {
    if (isLoading || !product) return;

    // Premium entrance animations for product elements
    gsap.fromTo(
      '.immersive-image-container',
      { opacity: 0, scale: 1.03 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
    )

    gsap.fromTo(
      '.stagger-fade-in',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out', delay: 0.1 }
    )

    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-[10px]');
        }
      });
    }, observerOptions);

    const elements = container.current?.querySelectorAll('.scroll-reveal');
    elements?.forEach(el => observer.observe(el));

    return () => observer.disconnect()
  }, { scope: container, dependencies: [isLoading, product] })

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true)
    try {
      const auth = getAuth(app)
      const user = auth.currentUser

      if (!user) {
        router.push('/login')
        return
      }

      const token = await user.getIdToken()

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity
        })
      })

      const data = await res.json()
      if (data.success) {
        alert('Added to Cart!')
      } else {
        alert('Failed to add to cart: ' + data.error)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred adding to cart')
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen pt-[110px] flex items-center justify-center">
          <div className="animate-pulse bg-surface-container w-32 h-32 rounded-full"></div>
        </div>
      </StorefrontLayout>
    )
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="min-h-screen pt-[110px] flex items-center justify-center">
          <p className="text-on-surface-variant font-mono uppercase tracking-widest">Product not found.</p>
        </div>
      </StorefrontLayout>
    )
  }

  const mainImage = product.images?.[activeImageIdx] || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoG6wN1NHCftwcIFa2sqpTHrkS8MBWm-dqYaHnBXwKAGsF15rXY32Q4QIgvsn4ylFEpfhls2UMr9TVojABrzmku7zZiYDLauOz1xPLaAi7br4lYsaSDNk2tmbjwtWDdFRrZN4q2l96jRKpW5x9-DxqSZsdfVXsT-m-hnfrfCqK9vkAm6obYuoKQnOl3XjKkKyowqxSL42jVgTymLDLdFcHsPqFxO5CtXr6gA7DMQimBEwQRQ9MPaWgBl2nWI1SuJUpR8c0UiLGOM8w"

  return (
    <StorefrontLayout>
      <div ref={container} className="pt-[100px] min-h-screen">
        <section className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-12 gap-xl pb-xl md:items-start">
          {/* Left: Immersive Photography */}
          <div className="md:col-span-7 lg:col-span-8 relative group overflow-hidden">
            <div className="immersive-image-container relative aspect-[4/5] overflow-hidden bg-surface-container-low transition-transform duration-700 ease-in-out group-hover:scale-[1.01] border border-outline-variant">
              <img
                alt={product.name}
                className="w-full h-full object-cover grayscale-[0.3] contrast-[1.1] transition-all duration-500"
                src={mainImage}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none"></div>
            </div>

            {/* Product Gallery Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 aspect-[4/5] overflow-hidden border transition-all ${activeImageIdx === idx ? 'border-primary' : 'border-outline-variant opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Detail Zoom indicator */}
            <div className="mt-base flex justify-end">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant opacity-60">Enlarge Image</span>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col pt-0">
            <div className="sticky top-[120px]">
              {/* Header */}
              <div className="mb-lg stagger-fade-in">
                <h2 className="font-mono text-[14px] uppercase tracking-[0.3em] text-primary mb-xs">
                  {product.category ? `Archives / ${product.category}` : 'Archives / Objects'}
                </h2>
                <h1 className="font-mono text-[24px] tracking-tight text-on-background mb-base">
                  {product.name}
                </h1>
                <p className="font-mono text-[18px] text-on-surface">
                  LKR {product.price?.toLocaleString()}
                </p>
              </div>

              {/* Description */}
              <div className="mb-lg border-b border-outline-variant pb-lg stagger-fade-in">
                <p className="font-mono text-[12px] leading-relaxed text-on-surface-variant mb-md">
                  {product.description || "Hand-crafted to perfection. Each piece is unique and brings a sense of spiritual minimalism to your environment."}
                </p>
              </div>

              {/* Specifications Grid */}
              <div className="mb-xl stagger-fade-in">
                <div className="grid grid-cols-2 gap-y-md gap-x-gutter">
                  {product.material && (
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-xs">Material</h4>
                      <p className="font-mono text-[11px] text-on-surface">{product.material}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-xs">Origin</h4>
                    <p className="font-mono text-[11px] text-on-surface">Central Highlands</p>
                  </div>
                  {product.color && (
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-xs">Colours</h4>
                      <p className="font-mono text-[11px] text-on-surface">{product.color}</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-xs">Dimensions</h4>
                      <p className="font-mono text-[11px] text-on-surface">{product.dimensions}</p>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-xs">Weight</h4>
                      <p className="font-mono text-[11px] text-on-surface">{product.weight}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactions */}
              <div className="flex flex-col gap-md stagger-fade-in">
                <div className="flex items-center justify-between border border-outline-variant px-md py-sm">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">Quantity</span>
                  <div className="flex items-center gap-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-on-surface hover:text-primary transition-colors material-symbols-outlined text-[18px]"
                    >
                      remove
                    </button>
                    <span className="font-mono text-[14px]" id="qty">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="text-on-surface hover:text-primary transition-colors material-symbols-outlined text-[18px]"
                    >
                      add
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-primary text-on-primary font-bold py-md px-lg font-mono text-[13px] uppercase tracking-[0.2em] hover:brightness-110 transition-all duration-300 disabled:opacity-50"
                >
                  {isAdding ? 'ADDING...' : 'ADD TO SANCTUARY'}
                </button>
              </div>

              {/* Bottom Action */}
              <div className="mt-xl flex justify-center stagger-fade-in">
                <Link
                  href="/shop"
                  className="font-mono text-[11px] uppercase tracking-[0.3em] text-on-surface-variant hover:text-primary border-b border-transparent hover:border-primary transition-all duration-300 pb-xs"
                >
                  BACK TO GALLERY
                </Link>
              </div>
            </div>
          </div>
        </section>


      </div>
    </StorefrontLayout>
  )
}

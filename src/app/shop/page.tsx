'use client'

import { useEffect, useRef, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { formatPrice } from '@/lib/formatPrice'
import { showToast } from '@/components/storefront/Toast'
import { getAuth } from 'firebase/auth'
import app from '@/lib/firebase'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category?: string
  slug: string
}

function ShopContent() {
  const container = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryQuery = searchParams.get('category')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  // States for search, filter, sort, and pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryQuery)
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    if (categoryQuery) {
      setSelectedCategory(categoryQuery)
      setCurrentPage(1)
    }
  }, [categoryQuery])

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Filter to only show published products client-side to avoid Firestore index errors
          const publishedProducts = data.data.filter((p: any) => p.visibility === 'published')
          setAllProducts(publishedProducts)
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch products', err)
        setIsLoading(false)
      })
  }, [])

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId)
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
        body: JSON.stringify({ productId, quantity: 1 })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Added to cart')
      } else {
        showToast('Failed to add to cart', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('An error occurred', 'error')
    } finally {
      setAddingToCart(null)
    }
  }

  const handleBuyNow = async (productId: string) => {
    setAddingToCart(productId)
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
        body: JSON.stringify({ productId, quantity: 1 })
      })
      const data = await res.json()
      if (data.success) {
        router.push('/checkout')
      } else {
        showToast('Failed to add to cart', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('An error occurred', 'error')
    } finally {
      setAddingToCart(null)
    }
  }

  // Apply search, filter, and sort
  const processedProducts = useMemo(() => {
    let filtered = [...allProducts]

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      )
    }

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
    }

    return filtered
  }, [allProducts, selectedCategory, searchQuery, sortBy])

  // Pagination logic
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage)

  useEffect(() => {
    // Reset to page 1 if current page is out of bounds after filtering
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return processedProducts.slice(startIndex, startIndex + itemsPerPage)
  }, [processedProducts, currentPage, itemsPerPage])

  useGSAP(() => {
    if (isLoading) return;

    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
          entry.target.classList.remove('opacity-0', 'translate-y-4');
        }
      });
    }, observerOptions);

    const cards = container.current?.querySelectorAll('.product-card');
    cards?.forEach((card, i) => {
      card.classList.add('opacity-0', 'translate-y-4');
      (card as HTMLElement).style.transitionDelay = `${i * 50}ms`;
      observer.observe(card);
    });

    return () => observer.disconnect()
  }, { scope: container, dependencies: [isLoading, paginatedProducts] })

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
  ] as const;

  return (
    <StorefrontLayout>
      <div ref={container} className="pt-[110px] pb-xl px-gutter max-w-container-max mx-auto flex gap-xl min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-[100px] h-[calc(100vh-100px)]">
          <div className="mb-lg">
            <h3 className="font-label-sm text-[10px] text-primary uppercase mb-md tracking-[0.2em] opacity-80">Search</h3>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-2 px-0 text-body-md focus:ring-0 focus:border-primary placeholder:text-on-surface-variant/30 uppercase font-caption text-[10px] transition-all duration-500"
                placeholder="FIND ARTISANRY..."
                type="text"
              />
            </div>
          </div>
          <div className="mb-lg">
            <h3 className="font-label-sm text-[10px] text-primary uppercase mb-md tracking-[0.2em] opacity-80">Categories</h3>
            <ul className="space-y-xs">
              <li>
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`font-headline-md text-[13px] ${!selectedCategory ? 'text-primary border-l border-primary pl-4' : 'text-on-surface-variant pl-4 hover:text-on-surface hover:pl-5'} w-full text-left transition-all duration-500`}
                >
                  THE COLLECTION
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Spiritual & Zen')}
                  className={`font-headline-md text-[13px] ${selectedCategory === 'Spiritual & Zen' ? 'text-primary border-l border-primary pl-4' : 'text-on-surface-variant pl-4 hover:text-on-surface hover:pl-5'} w-full text-left transition-all duration-500`}
                >
                  SPIRITUAL & ZEN
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Home Decor')}
                  className={`font-headline-md text-[13px] ${selectedCategory === 'Home Decor' ? 'text-primary border-l border-primary pl-4' : 'text-on-surface-variant pl-4 hover:text-on-surface hover:pl-5'} w-full text-left transition-all duration-500`}
                >
                  HOME DECOR
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('Gift Sets')}
                  className={`font-headline-md text-[13px] ${selectedCategory === 'Gift Sets' ? 'text-primary border-l border-primary pl-4' : 'text-on-surface-variant pl-4 hover:text-on-surface hover:pl-5'} w-full text-left transition-all duration-500`}
                >
                  GIFT SETS
                </button>
              </li>
            </ul>
          </div>
          <div className="mt-xl pt-lg border-t border-outline-variant/20">
            <p className="font-caption text-[11px] text-on-surface-variant italic opacity-40">"Silence is the ultimate luxury."</p>
          </div>
        </aside>

        {/* Product Grid Section */}
        <section className="flex-grow">
          {/* Header/Breadcrumb */}
          <div className="flex justify-between items-end mb-lg border-b border-outline-variant/10 pb-base">
            <div>
              <h2 className="font-headline-xl text-[24px] text-on-surface mb-xs uppercase tracking-[0.1em]">
                {selectedCategory ? selectedCategory : 'The Collection'}
              </h2>
              <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">
                Handmade in Sri Lanka / {processedProducts.length} Artifacts
              </p>
            </div>
            <div className="flex gap-md items-center font-label-sm text-[10px] text-on-surface-variant uppercase tracking-[0.15em] relative">
              <span className="opacity-40">Sort:</span>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="text-primary flex items-center gap-1 hover:opacity-70 transition-all duration-500"
              >
                {sortOptions.find(o => o.value === sortBy)?.label}
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest border border-outline-variant/20 py-2 min-w-[160px] z-20 shadow-xl">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSortBy(option.value); setIsSortOpen(false); setCurrentPage(1); }}
                      className={`block w-full text-left px-4 py-2 hover:bg-surface-container/50 transition-colors ${sortBy === option.value ? 'text-primary' : 'text-on-surface'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, n) => (
                <div key={n} className="aspect-[4/5] bg-surface-container/50 animate-pulse"></div>
              ))
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <div key={product.id} className="product-card group relative bg-surface-container-lowest overflow-hidden transition-all duration-500">
                  <div className="aspect-[4/5] relative overflow-hidden bg-surface-container">
                    <img
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                      src={(product as any).image || product.images?.[0] || "https://lh3.googleusercontent.com/aida-public/AB6AXuCiAIswvjrF9HTZmSMQy6JLDwQRGsF_my1U0hdV-thkItODTBZrnvDK2QJb6onKSmriycMN4WCUd53TZ29dhcjWZ1rkFRk2jXJzhvMGsROAm-LH_6F2nPAPQtsZV5LYseSeNBrVuOUewOPUQC_bHHH9no3sfaeOsNjCDdJ_HbwUCjzwAqbviah1YzhoxAg7q5UjH4O5JEa9s8pC5B0Mlhm7a8S52t289U5k6bEcjTuywzdbwIKqGbBITxRJ65YQfGrMyJovDcUpqFII"}
                    />
                    <div className="overlay absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-sm">
                      <Link href={`/shop/${product.id}`}>
                        <button className="border border-primary/50 text-primary px-lg py-sm font-label-sm text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-500 min-w-[160px]">
                          Quick View
                        </button>
                      </Link>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={addingToCart === product.id}
                        className="border border-primary text-on-primary bg-primary px-lg py-sm font-label-sm text-[10px] uppercase tracking-widest hover:brightness-110 transition-all duration-500 disabled:opacity-50 min-w-[160px]"
                      >
                        {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(product.id)}
                        disabled={addingToCart === product.id}
                        className="border border-outline-variant/50 text-on-surface px-lg py-sm font-label-sm text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-500 disabled:opacity-50 min-w-[160px]"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                  <div className="p-md text-center">
                    <h4 className="font-headline-md text-[13px] tracking-[0.05em] mb-xs uppercase opacity-90">{product.name}</h4>
                    <p className="font-label-sm text-[10px] tracking-[0.15em] text-primary">{formatPrice(product.price)}</p>
                    <div className="mt-base flex justify-center opacity-0 group-hover:opacity-40 transition-all duration-500">
                      <span className="text-caption font-caption text-[11px] text-on-surface-variant uppercase tracking-tighter">
                        {product.category || 'Handmade Artifact'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-on-surface-variant py-xl">No artifacts found.</p>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-xl flex justify-center gap-lg items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-on-surface-variant hover:text-primary transition-all duration-500 disabled:opacity-30 disabled:hover:text-on-surface-variant"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex gap-md font-label-sm text-[10px]">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`cursor-pointer transition-all duration-500 ${currentPage === i + 1 ? 'text-primary border-b border-primary pb-xs' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-on-surface-variant hover:text-primary transition-all duration-500 disabled:opacity-30 disabled:hover:text-on-surface-variant"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </StorefrontLayout>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-on-surface-variant font-caption text-[11px] uppercase tracking-widest">Loading...</div>}>
      <ShopContent />
    </Suspense>
  )
}

'use client'

import { useRef, useEffect, useState } from 'react'
import { getPopularProducts } from '@/lib/store-service'
import type { Product } from '@/types'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export default function HomePage() {
  const container = useRef<HTMLDivElement>(null)
  const [popularProducts, setPopularProducts] = useState<Product[]>([])

  useEffect(() => {
    getPopularProducts(3).then(setPopularProducts).catch(console.error)
  }, [])

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.to("#hero-img", { scale: 1, duration: 2.5, ease: "power2.out" })
      .to(".stagger-item", { opacity: 1, y: -10, duration: 1.2, stagger: 0.3, ease: "power3.out" }, "-=1.5")
      .to("#scroll-line", { y: "100%", duration: 2, repeat: -1, ease: "none" }, "-=0.5")

    // Philosophy Section Parallax
    gsap.from("#philosophy-image img", {
      scrollTrigger: {
        trigger: "#philosophy-image",
        start: "top bottom",
        end: "bottom top",
        scrub: true
      },
      y: -30,
      scale: 1.05
    })

    gsap.from("#philosophy-text", {
      scrollTrigger: {
        trigger: "#philosophy-text",
        start: "top 85%",
      },
      opacity: 0,
      y: 20,
      duration: 1.5,
      ease: "power2.out"
    })

    // Popular Products Grid Stagger
    gsap.from("#popular-grid > div", {
      scrollTrigger: {
        trigger: "#popular-grid",
        start: "top 85%",
      },
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: "power2.out"
    })

    // Testimonials Stagger
    gsap.from("#testimonials-grid > div", {
      scrollTrigger: {
        trigger: "#testimonials-grid",
        start: "top 85%",
      },
      opacity: 0,
      y: 20,
      duration: 1,
      stagger: 0.2,
      ease: "power2.out"
    })

    // Product Grid Stagger
    gsap.from("#product-grid > div", {
      scrollTrigger: {
        trigger: "#product-grid",
        start: "top 85%",
      },
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: "power2.out"
    })
  }, { scope: container })

  return (
    <StorefrontLayout>
      <div ref={container}>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden" id="hero">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover  opacity-50 scale-110"
              id="hero-img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPrawEcq7BOXMc2OfCUGAVspe9tUXW0MQNBRhQke_bGBY63vcO00q2VEGKsy8LqNiRthCjKab7-xO_JPcBORXeymTAKgCcx5imI9SujgJCryq_BBh4Q4BAwWFDspIF4BYWVD0TYqi73vwgwzQHOxyBxtgVCPBGF5mpwq_XASL78ramudBbcmFAzqGh6EcSI7PzolFRN78-XTrHTaFlgWGtKDPyEhNoV9eZKsMgJryClIUQE0fZiO6GA4Dl3UGzvih1ZrE2hWVTm6Eb"
              alt="Hero image"
            />
            <div className="hero-gradient absolute inset-0"></div>
          </div>
          <div className="relative z-10 text-center max-w-[672px] px-gutter">
            <p className="font-label-sm text-[10px] text-primary uppercase tracking-[0.6em] mb-base stagger-item opacity-80">The Ancient Art of Stillness</p>
            <h2 className="font-display-lg text-[32px] text-on-surface mb-lg leading-snug stagger-item">Curated Spirits for the Modern Sanctuary</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-md stagger-item">
              <Link href="/shop" className="px-lg py-xs border border-primary/20 bg-primary/10 text-primary font-label-sm text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary">Explore Collection</Link>
              <Link href="/about" className="px-lg py-xs border border-outline-variant text-on-surface-variant font-label-sm text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary">The Artisan Story</Link>
            </div>
          </div>
          <div className="absolute bottom-lg left-1/2 -translate-x-1/2 flex flex-col items-center gap-xs opacity-30">
            <span className="font-caption text-[11px] text-on-surface-variant uppercase tracking-[0.2em]">Scroll to Descend</span>
            <div className="w-[1px] h-8 bg-outline-variant relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-primary -translate-y-full" id="scroll-line"></div>
            </div>
          </div>
        </section>

        {/* Popular Artifacts Section */}
        <section className="py-xl bg-surface">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex flex-col items-center mb-xl text-center">
              <span className="font-label-sm text-[10px] text-primary uppercase tracking-[0.4em] mb-base">Featured</span>
              <h3 className="font-headline-xl text-[24px] text-on-surface">Popular Artifacts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg" id="popular-grid">
              {popularProducts.length > 0 ? (
                popularProducts.map((product) => (
                  <div key={product.id} className="group flex flex-col gap-base">
                    <div className="aspect-[3/4] bg-surface-container overflow-hidden relative border border-outline-variant/10">
                      <Link href={`/shop/${product.id}`}>
                        <img className="w-full h-full object-cover filter grayscale opacity-70 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" src={product.images?.[0] || ''} alt={product.name} />
                      </Link>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-body-md text-[13px] text-on-surface">{product.name}</p>
                        <p className="font-caption text-[11px] text-on-surface-variant">Rs.{product.price.toFixed(2)}</p>
                      </div>
                      <Link href={`/shop/${product.id}`} className="font-label-sm text-[10px] text-primary uppercase tracking-widest border-b border-primary/30 pb-[2px] hover:border-primary">View Details</Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-3 text-center text-on-surface-variant text-[13px] h-[300px] flex items-center justify-center">
                  <span className="opacity-50">Curating our most loved artifacts...</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sanctuary Voices (Testimonials) Section */}
        <section className="py-xl bg-surface-container-lowest border-y border-outline-variant/20">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex flex-col items-center mb-xl text-center">
              <span className="font-label-sm text-[10px] text-primary uppercase tracking-[0.4em] mb-base">Testimonials</span>
              <h3 className="font-headline-xl text-[24px] text-on-surface">Sanctuary Voices</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl" id="testimonials-grid">
              {/* Testimonial 1 */}
              <div className="flex flex-col items-center text-center space-y-md">
                <span className="material-symbols-outlined text-primary text-[24px] opacity-40" data-icon="format_quote">format_quote</span>
                <p className="font-body-lg text-[14px] text-on-surface italic">"A moment of stillness in a vessel. The craftsmanship is profoundly grounding."</p>
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">— E.R., Kyoto</span>
              </div>
              {/* Testimonial 2 */}
              <div className="flex flex-col items-center text-center space-y-md">
                <span className="material-symbols-outlined text-primary text-[24px] opacity-40" data-icon="format_quote">format_quote</span>
                <p className="font-body-lg text-[14px] text-on-surface italic">"Quiet luxury defined. It transforms my daily rituals into sacred pauses."</p>
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">— M.T., London</span>
              </div>
              {/* Testimonial 3 */}
              <div className="flex flex-col items-center text-center space-y-md hidden lg:flex">
                <span className="material-symbols-outlined text-primary text-[24px] opacity-40" data-icon="format_quote">format_quote</span>
                <p className="font-body-lg text-[14px] text-on-surface italic">"The texture alone tells a story of ancient techniques brought to modern spaces."</p>
                <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">— A.L., New York</span>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="py-xl bg-surface-container-lowest">
          <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 md:grid-cols-12 gap-xl items-center">
            <div className="md:col-span-5 space-y-md" id="philosophy-text">
              <span className="font-label-sm text-[10px] text-primary uppercase tracking-[0.4em]">Our Philosophy</span>
              <h3 className="font-headline-xl text-[24px] text-on-surface">Spiritual Minimalism in Every Grain.</h3>
              <p className="font-body-lg text-[14px] text-on-surface-variant">Lola Studio bridges the gap between ancient Sri Lankan craftsmanship and the quiet precision of modern luxury. Each piece is hand-carved, slow-fired, and intentionally curated to bring a sense of reverence to your daily rituals.</p>
              <Link className="inline-block font-label-sm text-[10px] text-primary uppercase tracking-widest border-b border-primary/30 pb-xs hover:border-primary" href="/about">Read the Manifesto</Link>
            </div>
            <div className="md:col-span-7 relative h-[500px] overflow-hidden" id="philosophy-image">
              <img className="w-full h-full object-cover filter grayscale opacity-70 hover:opacity-100 hover:grayscale-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRrYGvzKrfe8EXKLztfoYQ8oYA0RC5rIsJp0QI-1fd--0ct_NoRdXlwBgX6KSrn2N66cvvp5EhQW6Pe-Fx0DZz1Zv5Ur4ExXRkMNz6SogstRggSebvpxZ_wfBIvLMi9U4ChoeT810y86VMDFlxEwINjMECGzL_GHC3OyA7XElS2WzyxCD_U-WpUVEyQeswLJ6RmbJy9mQRJ9Q5bywudF-xpNiLmFIzxj5aOq4Sy9pNox39cU2sHbtlWr8KzmpX9_LI_4enOPl56Xuu" alt="Philosophy image" />
              <div className="absolute inset-0 border border-outline-variant/20 pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Featured Collection Bento Grid */}
        <section className="py-xl bg-surface">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="flex justify-between items-end mb-lg">
              <div className="space-y-base">
                <span className="font-label-sm text-[10px] text-primary uppercase tracking-[0.4em]">The Collection</span>
                <h3 className="font-headline-xl text-[24px] text-on-surface">Curated Essentials</h3>
              </div>
              <Link className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest hover:text-primary" href="/shop">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter" id="product-grid">
              {/* Featured Product 1 (Tall) */}
              <div className="md:col-span-2 md:row-span-2 group overflow-hidden relative">
                <Link href="/shop">
                  <div className="aspect-[4/5] bg-surface-container overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-105 opacity-80 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBupnGE_YYC_Cngc1o0f4Hyv-obJPk8cBCG8U1dJrdRYJ7gzBVFWsvzyibwqNcSr7_lR-CWEgzt9ublkDfebap-r4JhxNSbjqiSksd2cgVPyr-9VGZ961x2sUG-ffiaRowzvvJliiguq6j7vHEjcczhDMRd9ugL5Eu_5gDZL3OVm92ZqtW6zvotKoGuEm9Wl7K46gmouRzPcr1WoRo3yMk2xps2vpyVs_822kBT35vaEBzf3lgiCujKvCbosxE0-Zf3sbGPpU95jJUt" alt="The Monolith Burner" />
                  </div>
                  <div className="mt-md flex justify-between items-start">
                    <div>
                      <p className="font-headline-md text-[18px] text-on-surface">The Monolith Burner</p>
                      <p className="font-caption text-[11px] text-on-surface-variant">Charcoal Ceramic</p>
                    </div>
                    <span className="font-label-sm text-[10px] text-primary">$180.00</span>
                  </div>
                </Link>
              </div>
              {/* Product 2 */}
              <div className="group">
                <Link href="/shop">
                  <div className="aspect-square bg-surface-container overflow-hidden relative border border-outline-variant/10">
                    <img className="w-full h-full object-cover group-hover:scale-105 opacity-80 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXM1uFREFkV2lu8guVuYIEmg4e1xh8kNp_t41oiUA4q2S0QeIVAhb5Js3yCWl68EkOgUyg0gXgC3WNcyJbx-Uft33XuKzGWuL8hAOltEV3NMzadKuoeRQrLwQJV6GmXLZraehSZAIaPwiF9iICBnvG3dpFO9SfMUH8GIaiqbwI1luG0wKZnL5kIzn-e0flGg3jzBivfzpI2gy1SbTX3jcyvHmG2DQbh6nPo-jpFh4U21MmVjdNpRKtg_BsLlV1k-_2p_GRsze2QmjZ" alt="Vessent Offering Bowl" />
                  </div>
                  <div className="mt-base">
                    <p className="font-body-md text-[13px] text-on-surface">Vessent Offering Bowl</p>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">$85.00</span>
                  </div>
                </Link>
              </div>
              {/* Product 3 */}
              <div className="group">
                <Link href="/shop">
                  <div className="aspect-square bg-surface-container overflow-hidden relative border border-outline-variant/10">
                    <img className="w-full h-full object-cover group-hover:scale-105 opacity-80 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5JRSot5rl4Wly_Xg4rw7KBvBcRvyTJ8RM-cShmKTqEU5-v_L88IxzGjvYes65dNNtmF542wDuYcdfxQiQrj8gkcnxNWFt-sE0xJuDONYFs4DcPL6bRjkXFpjzfmzW4lG6mkEmKwxDvGGWJKetj_ejU0E2-2yz8p3UGAGGp6zieGJlQpFADxYSC9lOH4gBlT2SwcxTMQKif75FwKgqOZfmS0WV14MPd9vFnM8gRTq6L0GKQgvnIc3ofCbCFh8wTYzkUXLXAn57rHFA" alt="Sandalwood Pillar" />
                  </div>
                  <div className="mt-base">
                    <p className="font-body-md text-[13px] text-on-surface">Sandalwood Pillar</p>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">$60.00</span>
                  </div>
                </Link>
              </div>
              {/* Product 4 (Wide) */}
              <div className="md:col-span-2 group">
                <Link href="/shop">
                  <div className="aspect-[16/9] bg-surface-container overflow-hidden relative border border-outline-variant/10">
                    <img className="w-full h-full object-cover group-hover:scale-105 opacity-80 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlC1MPSnf7fkRwmKiSOmEaWbUphxMvJBJzKbhKMyMXM5qzANNfsLEOweRj-vBNxhfHsOO2olieR5BuGrGGZq6Fu5f2R8rzCH1kA_Ll3npvX07N8YZxqsNNu7kSreFHPmU2v9vYug016mjiRpoLJreofK9DEGYXNjNkr1v046vDQCMERgzmZEU_UNDePSayWVaGdncDvNxzWjT2JwGspqJgKPf_VDjjX47f47pDuBFnIa04lZhEdNVgfxbtW_BiWMGzm9y1qMgXKO6w" alt="Zen Masterpiece Statue" />
                  </div>
                  <div className="mt-base flex justify-between">
                    <p className="font-body-md text-[13px] text-on-surface">Zen Masterpiece Statue</p>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">$450.00</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Atmospheric Quote Section */}
        <section className="py-xl relative h-[600px] flex items-center justify-center overflow-hidden">
          <div className="relative z-10 max-w-[576px] text-center px-gutter">
            <span className="material-symbols-outlined text-primary text-[32px] mb-lg opacity-40" data-icon="self_improvement">self_improvement</span>
            <h4 className="font-display-lg text-[24px] text-on-surface italic mb-lg leading-relaxed opacity-90">"The quieter you become, the more you are able to hear."</h4>
            <p className="font-label-sm text-[10px] text-primary uppercase tracking-[0.5em]">— ANCIENT WISDOM</p>
          </div>
        </section>
      </div>
    </StorefrontLayout>
  )
}

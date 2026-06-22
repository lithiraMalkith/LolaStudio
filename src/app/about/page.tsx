'use client'

import { useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export default function AboutPage() {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // Hero animations
    const tl = gsap.timeline()
    tl.to("#hero-img", { scale: 1, duration: 2.5, ease: "power2.out" })
      .to(".stagger-item", { opacity: 1, y: -10, duration: 1.2, stagger: 0.3, ease: "power3.out" }, "-=1.5")
      .to("#scroll-line", { y: "100%", duration: 2, repeat: -1, ease: "none" }, "-=0.5")

    // Story Section Reveal
    gsap.fromTo("#story-text > *", 
      { opacity: 0, y: 20 },
      { scrollTrigger: { trigger: "#story-text", start: "top 80%" }, opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power2.out" }
    )
    
    gsap.fromTo("#story-image", 
      { opacity: 0, scale: 0.95 },
      { scrollTrigger: { trigger: "#story-image", start: "top 80%" }, opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }
    )

    // Philosophy Cards
    gsap.fromTo(".philosophy-card", 
      { opacity: 0, y: 30 },
      { scrollTrigger: { trigger: "#philosophy-grid", start: "top 85%" }, opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power2.out" }
    )

    // Studio Section
    gsap.fromTo("#studio-content > *", 
      { opacity: 0, y: 20 },
      { scrollTrigger: { trigger: "#studio-content", start: "top 85%" }, opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power2.out" }
    )
    
    gsap.from("#studio-image", {
      scrollTrigger: { trigger: "#studio-image-container", start: "top 80%", scrub: true },
      y: -30, scale: 1.05
    })

  }, { scope: container })

  return (
    <StorefrontLayout>
      <div ref={container} className="pt-[64px] md:pt-[110px] min-h-screen">
        {/* Section 1: Hero */}
        <section className="relative h-[calc(100vh-64px)] w-full overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <img 
              id="hero-img"
              alt="Sri Lankan craftmanship" 
              className="w-full h-full object-cover filter grayscale brightness-[0.3] scale-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQkv1kKG-eCighzuvT57iN_JevkJeicAolD2UwPndNZY-jjNILHxNJI_Hd28BEbWvVgqOszQKcJfY_smfa3k6N450rOFuLw7H5ptuoW5qfMzxj5ayhL9gjmpWnJX4IJRmTZMrEwOTKjeU9DTGs1a0SkahZW4oaGeflxab9cZGALNAPggQidHU59IonrwGB5qscw2RnXo_K2-LcGtA_tWljrwlUoHHicA5gFbbgbPlESxmsclvS_j57UtF4xMFjNx-oRvvpGzWF9vg1"
            />
          </div>
          <div className="relative z-10 text-center px-gutter">
            <p className="font-label-sm text-[10px] text-primary mb-base tracking-[0.4em] uppercase stagger-item">The Art of Stillness</p>
            <h1 className="font-display-lg text-[42px] md:text-[56px] text-on-surface max-w-[896px] mx-auto leading-none stagger-item">
                CRAFTED IN THE HEART OF<br/>SILENT TRADITION
            </h1>
          </div>
          <div className="absolute bottom-xl left-1/2 -translate-x-1/2 flex flex-col items-center gap-base opacity-40 stagger-item">
            <span className="font-caption text-[11px] uppercase tracking-widest text-on-surface-variant">Scroll</span>
            <div className="w-[1px] h-12 bg-outline-variant relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-primary -translate-y-full" id="scroll-line"></div>
            </div>
          </div>
        </section>

        {/* Section 2: The Artisan Story */}
        <section className="max-w-container-max mx-auto px-gutter py-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-xl items-start">
            <div className="md:col-span-5 scroll-mt-[120px]" id="story-text">
              <h2 className="font-headline-xl text-[36px] text-on-surface mb-lg leading-tight">
                  The Slow<br/>Movement.
              </h2>
              <div className="w-12 h-[1px] bg-primary mb-lg"></div>
              <p className="font-body-lg text-[16px] text-on-surface-variant mb-md leading-relaxed font-light">
                  At Lola Studio, we believe that the soul of an object is defined by the pace at which it was created. Our process is a deliberate rebellion against the industrial hum of the modern world.
              </p>
              <p className="font-body-md text-[14px] text-on-surface-variant/70 italic leading-relaxed">
                  "Time is the most precious ingredient in our workshop. It cannot be synthetic; it must be lived."
              </p>
            </div>
            <div className="md:col-span-7 space-y-xl">
              <div className="aspect-[4/5] bg-surface-container relative overflow-hidden group" id="story-image">
                <img alt="Artisan workspace" className="w-full h-full object-cover grayscale transition-transform duration-[2000ms] group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-lFY1SIPGIinLbe-MtNVixAf6TzkoQIAkMMtET51gzKX-920p_YMvHg7WgSTIZZ9e1lzc464OGN4juTQXmXB_7q9AIewc1rLma5aQdt5ZNcUQJ9056VSqe8PGgF2JvRnoR3W-b_lmhZh1dnq2-VKmnoLcCMrCiBSsS6Fz-8w6P-VbOR0BGW-N5bGGaYA3juJb444XvfkBQJZ_hP8F1VF7kfo5OHWfLKl6ScS0LguJBdXcNZ5GW4oa1Vb_zXNlIATxrPdJyNOQCtP9"/>
              </div>
              <div className="pl-0 md:pl-xl md:border-l border-outline-variant/30">
                <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed font-light">
                    Every piece in our collection is hand-formed in small coastal ateliers across Sri Lanka. We work with third-generation artisans who treat their craft not as labor, but as a form of meditation. From the hand-pressed incense cones to the architectural clay statues, each curve and texture carries the fingerprint of its maker.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Our Philosophy (Bento-style Grid) */}
        <section className="bg-surface-container-lowest py-xl border-y border-outline-variant/20">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="mb-xl text-center">
              <h2 className="font-label-sm text-[10px] text-primary tracking-[0.4em] uppercase mb-base">Our Philosophy</h2>
              <p className="font-caption text-[11px] text-on-surface-variant/60 tracking-widest uppercase">A CONVERGENCE OF ETHICS AND AESTHETICS</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md scroll-mt-[120px]" id="philosophy-grid">
              {/* Spiritual Minimalism Card */}
              <div className="philosophy-card group relative p-lg border border-outline-variant/50 hover:border-primary/50 transition-all duration-700 overflow-hidden bg-surface-container-low/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.02] transition-opacity duration-700"></div>
                <span className="material-symbols-outlined text-primary mb-md text-[32px] opacity-80 group-hover:opacity-100 transition-opacity">self_improvement</span>
                <h3 className="font-headline-md text-[24px] text-on-surface mb-md tracking-tight">Spiritual Minimalism</h3>
                <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed font-light">
                    Design that demands nothing from you but your presence. We strip away the unnecessary to reveal the essence of form, creating objects that serve as anchors for mindfulness and daily ritual.
                </p>
              </div>
              {/* Ethical Sourcing Card */}
              <div className="philosophy-card group relative p-lg border border-outline-variant/50 hover:border-primary/50 transition-all duration-700 overflow-hidden bg-surface-container-low/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.02] transition-opacity duration-700"></div>
                <span className="material-symbols-outlined text-primary mb-md text-[32px] opacity-80 group-hover:opacity-100 transition-opacity">nature_people</span>
                <h3 className="font-headline-md text-[24px] text-on-surface mb-md tracking-tight">Ethical Sourcing</h3>
                <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed font-light">
                    Our materials are gathered with reverence for the land. We partner directly with local families, ensuring that the prosperity of our studio directly nourishes the communities that hold the knowledge of these ancient arts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Meet the Studio */}
        <section className="max-w-container-max mx-auto px-gutter py-[120px]">
          <div className="flex flex-col md:flex-row gap-xl items-center">
            <div className="w-full md:w-1/2 order-2 md:order-1 overflow-hidden" id="studio-image-container">
              <img id="studio-image" alt="Studio Origin" className="w-full aspect-[4/3] object-cover grayscale brightness-75 scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRqKeGfkh3DNHOM0Gd8EBkKPzaq7-6leYEKvaiYzbFtE_GFlZoOjrvC6k8cMKDAFJXNNLc8IIcFdKj0LYrwMAsNLLrCUr-hBI2GnD9RafCTROtriuLrldnAAr8UawCoyHi5elgWmWFZsZKQStKEBtTGFl1ASmaiyaXtnOsQ3r7SJCWDed1xUiG46S44FuEfy_NS5dTVDJ7VOWUT4lkxtUYNpQemtRGjeM9z45CoKMuedD20jm5I-hjfxnRjFPpc_cuwhKMYNcTOex6"/>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2 scroll-mt-[120px]" id="studio-content">
              <h2 className="font-headline-xl text-[36px] text-on-surface mb-md tracking-tight">Born of the Coast.</h2>
              <p className="font-body-lg text-[16px] text-on-surface-variant mb-xl leading-relaxed font-light">
                  Lola Studio began in a small seaside shed in Galle. What started as a personal quest to find objects that echoed the silence of the island's temples evolved into a collective of designers and makers dedicated to preserving the "Handmade Soul."
              </p>
              <Link href="/shop" className="group flex items-center gap-md py-base border-b border-primary/30 text-primary hover:border-primary transition-all duration-500 w-fit">
                <span className="font-label-sm text-[10px] uppercase tracking-widest">Explore The Collection</span>
                <span className="material-symbols-outlined transition-transform duration-500 group-hover:translate-x-2 text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </StorefrontLayout>
  )
}

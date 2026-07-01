'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="w-full relative" id="footer">
      {/* Top gradient divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>

      {/* Newsletter Section */}
      <div className="bg-surface-container-lowest py-xl px-gutter">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-lg">
          <div className="text-center md:text-left">
            <h4 className="font-headline-md text-[16px] text-on-surface uppercase tracking-widest mb-xs">Sacred Dispatches</h4>
            <p className="font-caption text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60">Receive curated stories & new arrivals to your inbox.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-sm w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR EMAIL ADDRESS"
              required
              className="bg-transparent border-b border-outline-variant/40 py-sm px-0 font-mono text-[11px] text-on-surface uppercase tracking-widest placeholder:text-on-surface-variant/30 focus:border-primary focus:outline-none transition-colors w-full md:w-64"
            />
            <button
              type="submit"
              className="px-lg py-sm border border-primary/40 text-primary font-label-sm text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-500 whitespace-nowrap"
            >
              {subscribed ? '✓ Subscribed' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Gradient divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent"></div>

      {/* Main Footer Content */}
      <div className="bg-surface-container-lowest py-xl px-gutter">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-xl mb-xl">
            {/* Brand Column */}
            <div className="space-y-md">
              <h5 className="text-gradient-gold text-[14px] tracking-[0.5em] uppercase font-light">LOLA STUDIO</h5>
              <p className="font-caption text-[11px] text-on-surface-variant leading-relaxed">Elevating the everyday through curated rituals and artisanal excellence.</p>
              {/* Social Icons */}
              <div className="flex gap-md pt-sm">
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:gold-glow transition-all duration-500"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </a>
                <a
                  href="https://vt.tiktok.com/ZSC1x1sW1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:gold-glow transition-all duration-500"
                >
                  <span className="material-symbols-outlined text-[18px]">music_note</span>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:gold-glow transition-all duration-500"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:gold-glow transition-all duration-500"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
              </div>
            </div>

            {/* Shop Column */}
            <div className="flex flex-col gap-base">
              <p className="font-label-sm text-[10px] text-primary uppercase mb-xs tracking-[0.2em]">Shop</p>
              <Link href="/shop?category=Spiritual+%26+Zen" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Spiritual & Zen</Link>
              <Link href="/shop?category=Home+Decor" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Home Decor</Link>
              <Link href="/shop?category=Gift+Sets" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Gift Sets</Link>
            </div>

            {/* Company Column */}
            <div className="flex flex-col gap-base">
              <p className="font-label-sm text-[10px] text-primary uppercase mb-xs tracking-[0.2em]">Company</p>
              <Link href="/about#story-text" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Artisan Story</Link>
              <Link href="/about#philosophy-grid" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Philosophy</Link>
              <Link href="/about#studio-content" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Born of the Coast</Link>
            </div>

            {/* Contact Column */}
            <div className="flex flex-col gap-base">
              <p className="font-label-sm text-[10px] text-primary uppercase mb-xs tracking-[0.2em]">Contact</p>
              <a href="#" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">WhatsApp</a>
              <a href="https://vt.tiktok.com/ZSC1x1sW1/" target="_blank" rel="noopener noreferrer" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">TikTok</a>
              <a href="#" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Facebook</a>
            </div>

            {/* Privacy Column */}
            <div className="flex flex-col gap-base">
              <p className="font-label-sm text-[10px] text-primary uppercase mb-xs tracking-[0.2em]">Privacy Policy</p>
              <Link href="/privacy#collection" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Data Collection</Link>
              <Link href="/privacy#usage" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">Data Usage</Link>
              <Link href="/privacy#rights" className="font-caption text-[11px] text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all duration-300">User Rights</Link>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent mb-lg"></div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-md">
            <p className="font-caption text-[10px] text-on-surface-variant uppercase tracking-[0.15em] opacity-60">© 2026 LOLA STUDIO. HANDMADE IN SRI LANKA.</p>
            <div className="flex items-center gap-lg">
              <a className="font-caption text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest opacity-40 hover:opacity-100 transition-all duration-300" href="#">Terms</a>
              <a className="font-caption text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest opacity-40 hover:opacity-100 transition-all duration-300" href="#">Shipping</a>
              <button
                onClick={scrollToTop}
                className="w-9 h-9 border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all duration-500 ml-md"
                aria-label="Back to top"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/cart-context'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { cartCount } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-outline-variant
        ${isScrolled ? 'bg-surface h-[64px]' : 'bg-surface/80 backdrop-blur-md h-lg'}
      `}
      id="top-app-bar"
    >
      <div className="max-w-container-max mx-auto px-gutter w-full h-full flex justify-between items-center relative">
        {/* Left: Account */}
        <div className="flex-1 flex justify-start">
          <Link href="/account" className="flex items-center justify-center w-10 h-10 text-primary hover:text-primary-fixed hover:scale-110 transition-all duration-300">
            <span className="material-symbols-outlined text-[24px]" data-icon="person">person</span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-xl hidden md:flex">
          <Link href="/" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-[0.2em] transition-colors font-medium">
            Home
          </Link>
          <Link href="/shop" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-[0.2em] transition-colors font-medium">
            Shop
          </Link>
          <Link href="/about" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-[0.2em] transition-colors font-medium">
            About
          </Link>
          <Link href="/contact" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-[0.2em] transition-colors font-medium">
            Contact
          </Link>
        </div>

        {/* Right: Cart */}
        <div className="flex-1 flex justify-end">
          <Link href="/cart" className="flex items-center justify-center w-10 h-10 text-primary hover:text-primary-fixed hover:scale-110 transition-all duration-300 relative">
            <span className="material-symbols-outlined text-[24px]" data-icon="shopping_bag">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-primary text-on-primary text-[10px] font-mono rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}

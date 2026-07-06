'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

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
      <div className="max-w-container-max mx-auto px-gutter w-full h-full flex justify-between items-center">
        <div className="flex items-center gap-md">
          <Link href="/" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-widest hidden md:block">
            Home
          </Link>
          <Link href="/shop" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-widest hidden md:block">
            Shop
          </Link>
        </div>
        
        <Link href="/">
          <h1 className="font-display-lg text-[14px] text-primary tracking-[0.5em] font-light uppercase cursor-pointer hover:tracking-[0.6em] transition-all">
            LOLA STUDIO
          </h1>
        </Link>
        
        <div className="flex items-center gap-sm">
          <Link href="/cart" className="flex items-center justify-center w-10 h-10 text-primary hover:text-primary-fixed hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]" data-icon="shopping_bag">shopping_bag</span>
          </Link>
          <Link href="/account" className="flex items-center justify-center w-10 h-10 text-primary hover:text-primary-fixed hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]" data-icon="person">person</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

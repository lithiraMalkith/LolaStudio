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
      className={`fixed top-0 w-full z-50 flex justify-between items-center px-gutter transition-all duration-300 border-b border-outline-variant
        ${isScrolled ? 'bg-surface h-[64px]' : 'bg-surface/80 backdrop-blur-md h-lg'}
      `} 
      id="top-app-bar"
    >
      <div className="flex items-center gap-md">
        <Link href="/shop" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-widest hidden md:block">
          Shop
        </Link>
        <Link href="/contact" className="text-primary hover:text-primary-fixed text-[13px] uppercase tracking-widest hidden md:block">
          Contact
        </Link>
        <button className="text-primary hover:scale-110 md:hidden">
          <span className="material-symbols-outlined" data-icon="menu">menu</span>
        </button>
      </div>
      
      <Link href="/">
        <h1 className="font-display-lg text-[14px] text-primary tracking-[0.5em] font-light uppercase cursor-pointer hover:tracking-[0.6em] transition-all">
          LOLA STUDIO
        </h1>
      </Link>
      
      <div className="flex items-center gap-md">
        <Link href="/cart" className="text-primary hover:text-primary-fixed hover:scale-110 transition-transform">
          <span className="material-symbols-outlined" data-icon="shopping_bag">shopping_bag</span>
        </Link>
        <Link href="/account" className="text-primary hover:text-primary-fixed hover:scale-110 transition-transform">
          <span className="material-symbols-outlined" data-icon="person">person</span>
        </Link>
      </div>
    </header>
  )
}

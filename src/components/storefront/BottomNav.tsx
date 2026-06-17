'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', icon: 'auto_awesome', label: 'Gallery' },
    { href: '/about', icon: 'self_improvement', label: 'Zen' },
    { href: '/shop', icon: 'auto_stories', label: 'Curated' },
    { href: '/account', icon: 'person', label: 'Account' },
  ]

  return (
    <nav className="fixed bottom-0 w-full z-50 flex md:hidden justify-around items-center px-4 py-base bg-surface-container-lowest/80 backdrop-blur-lg border-t border-outline-variant" id="bottom-nav-bar">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
        return (
          <Link 
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center transition-opacity ${isActive ? 'text-primary opacity-100' : 'text-on-surface-variant opacity-40 hover:opacity-100'}`}
          >
            <span className="material-symbols-outlined" data-icon={item.icon}>{item.icon}</span>
            <span className="font-label-sm text-[8px] mt-xs uppercase">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

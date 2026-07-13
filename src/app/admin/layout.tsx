'use client'

import { useRef, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  FolderTree,
  Shield,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import type { Permission } from '@/lib/permissions'
import AdminNotifications from './AdminNotifications'

interface SidebarItem {
  label: string
  href: string
  permission: Permission | string
  icon: React.ReactNode
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin', permission: 'dashboard:read', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Products', href: '/admin/products', permission: 'products:read', icon: <Package className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', permission: 'orders:read', icon: <ShoppingCart className="w-5 h-5" /> },
  { label: 'Customers', href: '/admin/customers', permission: 'customers:read', icon: <Users className="w-5 h-5" /> },
  { label: 'Inventory', href: '/admin/inventory', permission: 'inventory:read', icon: <Boxes className="w-5 h-5" /> },
  { label: 'Categories', href: '/admin/categories', permission: 'categories:read', icon: <FolderTree className="w-5 h-5" /> },
  { label: 'Roles', href: '/admin/roles', permission: 'roles:read', icon: <Shield className="w-5 h-5" /> },
  { label: 'Users', href: '/admin/users', permission: 'users:read', icon: <UserCog className="w-5 h-5" /> },
  { label: 'Messages', href: '/admin/messages', permission: 'messages:read', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', permission: 'settings:read', icon: <Settings className="w-5 h-5" /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, hasPermission, signOut, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const sidebarRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // GSAP page transition on content change
  useGSAP(
    () => {
      if (contentRef.current) {
        gsap.from(contentRef.current, {
          opacity: 0,
          y: 8,
          duration: 0.35,
          ease: 'power2.out',
        })
      }
    },
    { scope: contentRef, dependencies: [pathname] }
  )

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/adminlogin')
    }
  }, [user, loading, router])

  // Show loading while auth resolves
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
          <p className="text-brand-muted text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not logged in (useEffect will handle redirect)
  if (!user) {
    return null
  }

  // Filter sidebar items by permission
  const visibleItems = SIDEBAR_ITEMS.filter((item) => hasPermission(item.permission))

  const handleSignOut = async () => {
    await signOut()
    router.push('/adminlogin')
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'admin-sidebar fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          'lg:relative',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            'flex items-center h-16 px-5 border-b border-brand-border/50',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <h1 className="font-serif text-xl text-brand-gold tracking-wide">Lola Studio</h1>
          )}
          {collapsed && <span className="font-serif text-lg text-brand-gold">L</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-brand-muted hover:text-brand-text hover:bg-brand-surface transition-colors"
          >
            <ChevronLeft
              className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                router.push(item.href)
                setMobileOpen(false)
              }}
              className={cn(
                'sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'active bg-brand-gold-muted text-brand-gold'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-surface',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* User section */}
        <div className={cn('border-t border-brand-border/50 p-4', collapsed && 'px-2')}>
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm text-brand-text truncate">{user.email}</p>
              <p className="text-xs text-brand-gold capitalize">{role || 'user'}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-2 text-sm text-brand-muted hover:text-brand-danger transition-colors w-full',
              collapsed ? 'justify-center py-2' : 'px-1'
            )}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-brand-border/50 bg-brand-bg/80 backdrop-blur-md sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-brand-muted hover:text-brand-text"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <AdminNotifications />
            <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center">
              <span className="text-brand-gold text-sm font-medium">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main ref={contentRef} className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

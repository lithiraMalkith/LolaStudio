'use client'

import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import ToastProvider from './Toast'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen font-mono">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <ToastProvider />
    </div>
  )
}

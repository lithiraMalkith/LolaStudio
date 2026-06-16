import Header from './Header'
import Footer from './Footer'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen font-mono">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      {/* Bottom Nav (Mobile Only) */}
      <nav className="fixed bottom-0 w-full z-50 flex md:hidden justify-around items-center px-4 py-base bg-surface-container-lowest/80 backdrop-blur-lg border-t border-outline-variant" id="bottom-nav-bar">
        <a className="flex flex-col items-center justify-center text-primary" href="/shop">
          <span className="material-symbols-outlined" data-icon="auto_awesome">auto_awesome</span>
          <span className="font-label-sm text-[8px] mt-xs uppercase">Gallery</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant opacity-40 hover:opacity-100" href="/about">
          <span className="material-symbols-outlined" data-icon="self_improvement">self_improvement</span>
          <span className="font-label-sm text-[8px] mt-xs uppercase">Zen</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant opacity-40 hover:opacity-100" href="/shop">
          <span className="material-symbols-outlined" data-icon="auto_stories">auto_stories</span>
          <span className="font-label-sm text-[8px] mt-xs uppercase">Curated</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant opacity-40 hover:opacity-100" href="/account">
          <span className="material-symbols-outlined" data-icon="person">person</span>
          <span className="font-label-sm text-[8px] mt-xs uppercase">Account</span>
        </a>
      </nav>
    </div>
  )
}

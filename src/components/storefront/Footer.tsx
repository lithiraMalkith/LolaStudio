import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full py-xl px-gutter flex flex-col items-center gap-md bg-surface-container-lowest border-t border-outline-variant" id="footer">
      <div className="w-full max-w-container-max grid grid-cols-1 md:grid-cols-4 gap-xl mb-xl">
        <div className="space-y-md">
          <h5 className="font-display-lg text-[12px] text-primary tracking-[0.4em] uppercase font-light">LOLA STUDIO</h5>
          <p className="font-caption text-caption text-on-surface-variant">Elevating the everyday through curated rituals and artisanal excellence.</p>
        </div>
        <div className="flex flex-col gap-base">
          <p className="font-label-sm text-label-sm text-on-surface uppercase mb-xs opacity-60">Shop</p>
          <Link href="/shop?category=Spiritual+%26+Zen" className="font-caption text-caption text-on-tertiary-container hover:text-primary">SPIRITUAL & ZEN</Link>
          <Link href="/shop?category=Home+Decor" className="font-caption text-caption text-on-tertiary-container hover:text-primary">HOME DECOR</Link>
          <Link href="/shop?category=Gift+Sets" className="font-caption text-caption text-on-tertiary-container hover:text-primary">GIFT SETS</Link>
        </div>
        <div className="flex flex-col gap-base">
          <p className="font-label-sm text-label-sm text-on-surface uppercase mb-xs opacity-60">Company</p>
          <Link href="/about#story-text" className="font-caption text-caption text-on-tertiary-container hover:text-primary">Artisan Story</Link>
          <Link href="/about#philosophy-grid" className="font-caption text-caption text-on-tertiary-container hover:text-primary">Philosophy</Link>
          <Link href="/about#studio-content" className="font-caption text-caption text-on-tertiary-container hover:text-primary">Born of the Coast</Link>
        </div>
        <div className="flex flex-col gap-base">
          <p className="font-label-sm text-label-sm text-on-surface uppercase mb-xs opacity-60">Contact</p>
          <a href="#" className="font-caption text-caption text-on-tertiary-container hover:text-primary">WhatsApp</a>
          <a href="https://vt.tiktok.com/ZSC1x1sW1/" target="_blank" rel="noopener noreferrer" className="font-caption text-caption text-on-tertiary-container hover:text-primary">TikTok</a>
          <a href="#" className="font-caption text-caption text-on-tertiary-container hover:text-primary">Facebook</a>
        </div>
      </div>
      <div className="w-full flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/30 pt-lg gap-md">
        <p className="font-caption text-caption text-on-tertiary-container uppercase tracking-[0.1em] opacity-40">© 2026 LOLA STUDIO. HANDMADE IN SRI LANKA.</p>
        <div className="flex gap-md">
          <a className="text-on-surface-variant hover:text-primary opacity-40 hover:opacity-100" href="#"><span className="material-symbols-outlined" data-icon="public">public</span></a>
          <a className="text-on-surface-variant hover:text-primary opacity-40 hover:opacity-100" href="#"><span className="material-symbols-outlined" data-icon="mail">mail</span></a>
        </div>
      </div>
    </footer>
  )
}

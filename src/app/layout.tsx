import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'react-hot-toast'

const dmsans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Lola Studio — Handmade Home Décor & Spiritual Goods | Negombo, Sri Lanka',
    template: '%s | Lola Studio',
  },
  description:
    'Discover handcrafted Buddha statues, incense holders, wall art, and minimalist home décor. Cash on Delivery across Sri Lanka. Based in Negombo.',
  keywords: [
    'handmade home decor Sri Lanka',
    'Buddha statue Sri Lanka online',
    'minimalist home decor Negombo',
    'Lola Studio',
    'aesthetic room decor Sri Lanka COD',
    'buy home decor online Sri Lanka cash on delivery',
    'Budupilima',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_LK',
    siteName: 'Lola Studio',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${dmsans.variable} ${playfair.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text antialiased font-sans">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#161616',
                color: '#F0EDE8',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#4CAF7D', secondary: '#161616' },
              },
              error: {
                iconTheme: { primary: '#E05252', secondary: '#161616' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

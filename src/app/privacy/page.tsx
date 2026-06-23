'use client'

import { Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP)
}

const privacyData = [
  {
    id: 'collection',
    title: 'Data Collection',
    content: 'We honor your privacy as we honor our craft. Lola Studio collects only the essential information needed to fulfill your orders, communicate regarding your artifacts, and elevate your experience. This includes your name, shipping details, contact information, and interaction with our curated collections.'
  },
  {
    id: 'usage',
    title: 'Data Usage',
    content: 'Your personal data is treated with the utmost respect and is used strictly for processing transactions, arranging delivery, and providing customer support. We utilize this information to ensure a seamless journey from our studio to your sanctuary. We do not sell your personal information to any third parties.'
  },
  {
    id: 'rights',
    title: 'User Rights',
    content: 'In the spirit of transparency and spiritual minimalism, you possess the right to access, rectify, or erase your personal data at any moment. Should you wish to exercise these rights, or if you have any inquiries regarding how your data is handled, please reach out to us via our contact channels.'
  }
]

function PrivacyContent() {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.set('.privacy-block', { opacity: 0, y: 20 })
    
    gsap.to('.privacy-block', {
      opacity: 1, 
      y: 0, 
      duration: 1.2, 
      stagger: 0.2, 
      ease: 'power2.out',
      clearProps: 'all'
    })
  }, { scope: container })

  return (
    <div ref={container} className="pt-[140px] pb-xl px-gutter max-w-[800px] mx-auto min-h-[60vh]">
      <div className="mb-xl privacy-block">
        <h1 className="font-display-lg text-[24px] text-on-surface uppercase tracking-[0.2em] mb-md">
          Privacy Protocol
        </h1>
        <p className="font-mono text-[12px] text-on-surface-variant opacity-80 uppercase tracking-widest">
          Transparency in our sanctuary
        </p>
      </div>

      <div className="space-y-xl">
        {privacyData.map(section => (
          <div key={section.id} id={section.id} className="privacy-block border-t border-outline-variant/30 pt-lg scroll-mt-[160px]">
            <h2 className="font-mono text-[16px] text-primary uppercase tracking-[0.2em] mb-lg">
              {section.title}
            </h2>
            <p className="font-mono text-[13px] text-on-surface leading-relaxed opacity-90">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <StorefrontLayout>
      <PrivacyContent />
    </StorefrontLayout>
  )
}

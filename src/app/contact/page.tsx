'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export default function ContactPage() {
  const container = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [status, setStatus] = useState('Send Message')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useGSAP(() => {
    const observerOptions = { threshold: 0.05 }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0')
                entry.target.classList.remove('opacity-0', 'translate-y-4')
            }
        })
    }, observerOptions)

    const sections = container.current?.querySelectorAll('section, .reveal')
    sections?.forEach(el => {
      el.classList.add('transition-all', 'duration-[1000ms]', 'opacity-0', 'translate-y-4')
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, { scope: container })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setStatus('Transmitting...')
    
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message')
        })
      })

      const data = await res.json()
      if (data.success) {
        setStatus('Sent Successfully')
        setTimeout(() => {
          setStatus('Send Message')
          setIsSubmitting(false)
          form.reset()
        }, 3000)
      } else {
        setStatus('Error Sending')
        setTimeout(() => {
          setStatus('Send Message')
          setIsSubmitting(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setStatus('Error Sending')
      setTimeout(() => {
        setStatus('Send Message')
        setIsSubmitting(false)
      }, 3000)
    }
  }

  return (
    <StorefrontLayout>
      <div ref={container} className="pt-[64px] md:pt-[110px] min-h-screen">
        {/* Split-Screen Layout */}
        <section className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
          {/* Left: High-end Artisanal Image */}
          <div className="w-full md:w-1/2 relative overflow-hidden h-[300px] md:h-auto">
            <img 
              alt="Artisanal craft process" 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 hover:opacity-100 transition-all duration-[2000ms] ease-out" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-95tTZWZWaSaVIWjPLpqdQw82gh0KoW5IaFtc3V3NgrQZBAsJxwbUefJe3aJ6w4xmzMpB85nqP3mvTU6Q--EWIEMepBPBptsHC6ZNeeIzL9fYnK1kppT_B3ufPdM37BXnTtnmZZDk3hNwdoM-gYlVVNlTK2c7pi88MzfmULl2ZRe825Mc4gk1D7X9D2jSsdrzHU3Z8huAOct9mcQ5HqBVyXVaAt_Av0IpoeSssApECQ3xdzMXm4VpXL9-gTY4OaxTg1mR4K_6vsDx" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-12 left-8 max-w-[384px]">
              <p className="text-[10px] text-primary mb-2 tracking-[0.3em] uppercase font-medium">The Artisan Way</p>
              <h2 className="text-[20px] text-on-surface mb-3 font-medium">Crafted with Intention</h2>
              <p className="text-[13px] text-on-surface-variant leading-relaxed opacity-80">Every interaction is an extension of our spiritual philosophy. We welcome your inquiries with the same presence we bring to our work.</p>
            </div>
          </div>

          {/* Right: Contact Form & Details */}
          <div className="w-full md:w-1/2 bg-surface-container-low px-8 md:px-16 py-16 flex flex-col justify-center">
            <div className="max-w-[512px] mx-auto w-full reveal">
              <header className="mb-10">
                <h1 className="text-[32px] lg:text-[42px] text-on-surface mb-4 font-medium tracking-tight">Get in Touch</h1>
                <p className="text-[14px] text-on-surface-variant max-w-[448px] leading-relaxed opacity-70">Whether you have a question about our collection or a custom commission, our team is here to assist.</p>
              </header>

              {/* Contact Form */}
              {user ? (
                <form onSubmit={handleSubmit} className="space-y-8 mb-16">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium" htmlFor="name">Name</label>
                      <input defaultValue={user.displayName || ''} className="bg-transparent py-2 text-[13px] text-on-surface border-0 border-b border-outline-variant focus:border-primary focus:ring-0 transition-colors placeholder:text-outline-variant/50 px-0" id="name" name="name" placeholder="Name" type="text" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium" htmlFor="email">Email</label>
                      <input defaultValue={user.email || ''} className="bg-transparent py-2 text-[13px] text-on-surface border-0 border-b border-outline-variant focus:border-primary focus:ring-0 transition-colors placeholder:text-outline-variant/50 px-0" id="email" name="email" placeholder="Email" type="email" required />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium" htmlFor="subject">Subject</label>
                    <input className="bg-transparent py-2 text-[13px] text-on-surface border-0 border-b border-outline-variant focus:border-primary focus:ring-0 transition-colors placeholder:text-outline-variant/50 px-0" id="subject" name="subject" placeholder="Subject" type="text" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium" htmlFor="message">Message</label>
                    <textarea className="bg-transparent py-2 text-[13px] text-on-surface border-0 border-b border-outline-variant focus:border-primary focus:ring-0 transition-colors resize-none placeholder:text-outline-variant/50 px-0" id="message" name="message" placeholder="Message" rows={3} required></textarea>
                  </div>
                  <div className="pt-4">
                    <button 
                      disabled={isSubmitting}
                      className={`group relative w-full md:w-auto overflow-hidden bg-primary/10 border border-primary/20 px-10 py-3 text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-500 hover:bg-primary hover:text-on-primary-container disabled:opacity-70 ${status === 'Sent Successfully' ? 'bg-primary text-on-primary-container' : 'text-primary'}`} 
                      type="submit"
                    >
                      <span className="relative z-10">{status}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-16 p-8 border border-outline-variant bg-surface-container text-center">
                  <h3 className="text-[16px] text-on-surface mb-2 font-medium">Authentication Required</h3>
                  <p className="text-[13px] text-on-surface-variant mb-6 leading-relaxed">
                    We exclusively accept inquiries from registered members to ensure quality service and spiritual alignment.
                  </p>
                  <Link 
                    href="/login"
                    className="inline-block bg-primary text-on-primary px-8 py-3 text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-primary/90 transition-colors"
                  >
                    Log in to Contact Us
                  </Link>
                </div>
              )}

              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-outline-variant/30">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-primary uppercase tracking-widest font-medium">Email</p>
                  <a className="text-[12px] text-on-surface hover:text-primary transition-all duration-500" href="mailto:hello@lolastudio.lk">hello@lolastudio.lk</a>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-primary uppercase tracking-widest font-medium">WhatsApp</p>
                  <a className="text-[12px] text-on-surface hover:text-primary transition-all duration-500" href="#">+94 77 123 4567</a>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-primary uppercase tracking-widest font-medium">Instagram</p>
                  <a className="text-[12px] text-on-surface hover:text-primary transition-all duration-500" href="#">@lola.studio.lk</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </StorefrontLayout>
  )
}

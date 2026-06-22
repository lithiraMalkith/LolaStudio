'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface AuthError {
  title: string
  description: string
  suggestion?: string
}

function parseAuthError(msg: string): AuthError {
  // Firebase error codes
  if (msg.includes('user-not-found') || msg.includes('auth/user-not-found'))
    return { title: 'Account Not Found', description: 'No admin account exists with this email address.', suggestion: 'Check your email or contact the superadmin.' }
  if (msg.includes('wrong-password') || msg.includes('auth/wrong-password') || msg.includes('invalid-credential') || msg.includes('auth/invalid-credential'))
    return { title: 'Invalid Credentials', description: 'The email or password you entered is incorrect.', suggestion: 'Double-check your password.' }
  if (msg.includes('invalid-email') || msg.includes('auth/invalid-email'))
    return { title: 'Invalid Email', description: 'The email address format is not valid.', suggestion: 'Please enter a valid email address (e.g. name@domain.com).' }
  if (msg.includes('too-many-requests') || msg.includes('auth/too-many-requests'))
    return { title: 'Too Many Attempts', description: 'Access temporarily blocked due to too many failed attempts.', suggestion: 'Please wait a few minutes before trying again.' }
  if (msg.includes('network-request-failed') || msg.includes('auth/network-request-failed'))
    return { title: 'Network Error', description: 'Unable to connect to the authentication server.', suggestion: 'Check your internet connection and try again.' }
  if (msg.includes('user-disabled') || msg.includes('auth/user-disabled'))
    return { title: 'Account Disabled', description: 'This account has been disabled by an administrator.', suggestion: 'Contact support for assistance.' }
  if (msg.includes('requires-recent-login') || msg.includes('auth/requires-recent-login'))
    return { title: 'Session Expired', description: 'Your session has expired for security reasons.', suggestion: 'Please sign in again to continue.' }
  if (msg.includes('administrator') || msg.includes('member login'))
    return { title: 'Wrong Portal', description: msg, suggestion: 'Please navigate to the member login page.' }

  // Fallback
  const cleanMsg = msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim()
  return { title: 'Authentication Failed', description: cleanMsg || 'An unexpected error occurred.', suggestion: 'Please try again or contact support if the issue persists.' }
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  
  const { signInWithEmail, signOut } = useAuth()
  const router = useRouter()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!email || !password) throw new Error('Please enter email and password')
      const role = await signInWithEmail(email, password)
      // Admin roles only — reject regular users
      if (role === 'user') {
        await signOut()
        throw new Error('This portal is for administrators only. Please use the member login.')
      }
      router.push('/admin')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(parseAuthError(msg))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="font-mono text-[13px] antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        .blur-backdrop {
          backdrop-filter: blur(40px) brightness(0.6);
          -webkit-backdrop-filter: blur(40px) brightness(0.6);
        }
        .input-gold-focus:focus {
          outline: none;
          border-bottom-color: #e6c364;
        }
        .transition-premium {
          transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}} />

      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <img 
          alt="Sanctuary Background" 
          className="w-full h-full object-cover scale-110 blur-sm" 
          src="https://lh3.googleusercontent.com/aida/AP1WRLs8gi6dgY_C5K43J0nP--2Zst__xTmjoDpKr7LQDqhN5CgIuUEAmt8s0yRN9pfPcv9pnTuT0lnuyAkKkFsYUONuCmX6vLQga4vLSWFUCj2ESPiFZIKUNCV_cxrYiq6ZlN-L_gQMw_5KHXABYCEwnE26JR0j7VFwAT3AI80wdHIHPnG4_naIkGTUcDnMPp0hjPi1kQsFbJThTVXoi0lokvhYMtMv3iz8_jkXv8zWVfnJLjubB6aZg_J_Vs-f"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        
        {/* Login Card */}
        <div className="w-full max-w-[420px] bg-[#1c1c19]/80 blur-backdrop border border-[#4d4637]/20 p-8 shadow-2xl relative overflow-hidden group">
          
          {/* Subtle Gold Accent at Top */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e6c364]/50 to-transparent"></div>
          
          {/* Branding */}
          <div className="flex flex-col items-center mb-8">
            <h1 className="font-mono text-2xl text-[#e6c364] tracking-[0.3em] mb-1 font-medium">LOLA STUDIO</h1>
            <p className="font-mono text-[9px] text-[#d0c5b2] uppercase tracking-[0.4em] opacity-70">
              Administration Portal
            </p>
          </div>

          {/* Admin Badge */}
          <div className="flex items-center justify-center gap-2 mb-8 py-2 border border-[#4d4637]/20 bg-[#20201d]/30">
            <svg className="w-3.5 h-3.5 text-[#e6c364]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="font-mono text-[9px] text-[#d0c5b2]/50 uppercase tracking-[0.3em]">Authorized Access Only</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 bg-[#93000a]/10 border border-[#93000a]/25 p-4 relative">
              <button
                onClick={() => setError(null)}
                className="absolute top-2 right-2 text-[#ffb4ab]/40 hover:text-[#ffb4ab] transition-premium text-sm leading-none"
                aria-label="Dismiss error"
              >
                ×
              </button>
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#ffb4ab] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] text-[#ffb4ab] font-medium uppercase tracking-widest">
                    {error.title}
                  </p>
                  <p className="font-mono text-[10px] text-[#ffb4ab]/70 mt-1 leading-relaxed normal-case tracking-wide">
                    {error.description}
                  </p>
                  {error.suggestion && (
                    <p className="font-mono text-[9px] text-[#d0c5b2]/40 mt-2 leading-relaxed normal-case tracking-wide">
                      💡 {error.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Admin Login Form — Email/Password Only */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#d0c5b2]/60 uppercase tracking-widest focus-within:text-[#e6c364] transition-premium">
                Admin Email
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#4d4637]/40 py-1 px-0 text-[#e5e2dd] placeholder:text-[#d0c5b2]/20 input-gold-focus transition-premium text-[13px] focus:ring-0" 
                placeholder="admin@lolastudio.com" 
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#d0c5b2]/60 uppercase tracking-widest focus-within:text-[#e6c364] transition-premium">
                Password
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#4d4637]/40 py-1 px-0 text-[#e5e2dd] placeholder:text-[#d0c5b2]/20 input-gold-focus transition-premium text-[13px] focus:ring-0" 
                placeholder="••••••••" 
                required
                disabled={isLoading}
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#e6c364]/90 py-2 px-8 text-[#3d2e00] font-mono text-[11px] uppercase tracking-[0.3em] hover:bg-[#e6c364] transition-premium active:scale-[0.99] disabled:opacity-50 flex justify-center items-center h-10"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-t-2 border-[#3d2e00] rounded-full animate-spin"></span>
                    AUTHENTICATING...
                  </span>
                ) : (
                  'ADMIN SIGN IN'
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="font-mono text-[10px] text-[#d0c5b2]/30 uppercase tracking-widest">
              Contact your administrator for access
            </p>
          </div>
        </div>

        {/* Philosophical Footer */}
        <div className="fixed bottom-6 left-0 w-full px-6 flex flex-col md:flex-row justify-between items-end md:items-center gap-2 pointer-events-none opacity-30">
          <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-[#e5e2dd]">Ethically Sourced</span>
          <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-[#e5e2dd]">Handcrafted in Sri Lanka</span>
        </div>
      </main>

      {/* Subtle Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  )
}

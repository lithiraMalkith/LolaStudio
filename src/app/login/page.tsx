'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const router = useRouter()

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLogin(!isLogin)
    setError(null)
    setEmail('')
    setPassword('')
    setDisplayName('')
  }

  const routeUser = (role: string) => {
    if (role === 'user') {
      router.push('/account')
    } else {
      router.push('/admin')
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isLogin) {
        if (!email || !password) throw new Error('Please enter email and password')
        const role = await signInWithEmail(email, password)
        routeUser(role)
      } else {
        if (!email || !password || !displayName) throw new Error('Please fill in all fields')
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Registration failed')
        const role = await signInWithEmail(email, password)
        routeUser(role)
      }
    } catch (err) {
      let errorMessage = isLogin ? 'Login failed.' : 'Registration failed.'
      if (err instanceof Error) {
        const msg = err.message
        if (msg.includes('user-not-found')) errorMessage = 'User not found. Please sign up.'
        else if (msg.includes('wrong-password')) errorMessage = 'Incorrect password.'
        else if (msg.includes('email-already-in-use')) errorMessage = 'Email is already registered.'
        else if (msg.includes('invalid-email')) errorMessage = 'Invalid email address.'
        else if (msg.includes('weak-password')) errorMessage = 'Password should be at least 6 characters.'
        else errorMessage = msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '')
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const role = await signInWithGoogle()
      routeUser(role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.')
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
        .gold-underline-hover::after {
          content: '';
          position: absolute;
          width: 0;
          height: 1px;
          bottom: -2px;
          left: 0;
          background-color: #e6c364;
          transition: width 500ms ease;
        }
        .gold-underline-hover:hover::after {
          width: 100%;
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
              Ancient Wisdom, Modern Spirit
            </p>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-8">
            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-5 border border-[#4d4637]/30 bg-[#20201d]/50 hover:bg-[#2a2a27] transition-premium text-[#e5e2dd] group disabled:opacity-50"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-premium" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="font-mono text-[10px] tracking-widest uppercase">Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-5 mb-8">
            <div className="h-[1px] flex-1 bg-[#4d4637]/20"></div>
            <span className="font-mono text-[9px] text-[#d0c5b2]/40 uppercase tracking-widest">OR</span>
            <div className="h-[1px] flex-1 bg-[#4d4637]/20"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-[#93000a]/20 border border-[#93000a]/30 p-3 text-[#ffb4ab] text-[11px] text-center tracking-widest uppercase">
              {error}
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#d0c5b2]/60 uppercase tracking-widest focus-within:text-[#e6c364] transition-premium">
                  Full Name
                </label>
                <input 
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-[#4d4637]/40 py-1 px-0 text-[#e5e2dd] placeholder:text-[#d0c5b2]/20 input-gold-focus transition-premium text-[13px] focus:ring-0" 
                  placeholder="Jane Doe" 
                  required={!isLogin}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#d0c5b2]/60 uppercase tracking-widest focus-within:text-[#e6c364] transition-premium">
                Email Address
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#4d4637]/40 py-1 px-0 text-[#e5e2dd] placeholder:text-[#d0c5b2]/20 input-gold-focus transition-premium text-[13px] focus:ring-0" 
                placeholder="name@domain.com" 
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] text-[#d0c5b2]/60 uppercase tracking-widest focus-within:text-[#e6c364] transition-premium">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="font-mono text-[10px] text-[#e6c364]/50 hover:text-[#e6c364] transition-premium">
                    Forgot?
                  </a>
                )}
              </div>
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
                    {isLogin ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}
                  </span>
                ) : (
                  isLogin ? 'SIGN IN' : 'SIGN UP'
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="font-mono text-[11px] text-[#d0c5b2]/60">
              {isLogin ? 'New to Lola Studio? ' : 'Already have an account? '}
              <a 
                href="#" 
                onClick={toggleMode}
                className="text-[#e6c364] ml-1 relative gold-underline-hover inline-block"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </a>
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


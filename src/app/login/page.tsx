'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface AuthError {
  title: string
  description: string
  suggestion?: string
}

function parseAuthError(msg: string, context: 'login' | 'register' | 'google'): AuthError {
  // Firebase error codes
  if (msg.includes('user-not-found') || msg.includes('auth/user-not-found'))
    return { title: 'Account Not Found', description: 'No account exists with this email address.', suggestion: 'Check your email or create a new account.' }
  if (msg.includes('wrong-password') || msg.includes('auth/wrong-password') || msg.includes('invalid-credential') || msg.includes('auth/invalid-credential'))
    return { title: 'Invalid Credentials', description: 'The email or password you entered is incorrect.', suggestion: 'Double-check your password or use "Forgot?" to reset it.' }
  if (msg.includes('email-already-in-use') || msg.includes('auth/email-already-in-use'))
    return { title: 'Email Already Registered', description: 'An account with this email address already exists.', suggestion: 'Try signing in instead, or use a different email.' }
  if (msg.includes('invalid-email') || msg.includes('auth/invalid-email'))
    return { title: 'Invalid Email', description: 'The email address format is not valid.', suggestion: 'Please enter a valid email address (e.g. name@domain.com).' }
  if (msg.includes('weak-password') || msg.includes('auth/weak-password'))
    return { title: 'Weak Password', description: 'Your password does not meet the minimum requirements.', suggestion: 'Use at least 6 characters with a mix of letters and numbers.' }
  if (msg.includes('too-many-requests') || msg.includes('auth/too-many-requests'))
    return { title: 'Too Many Attempts', description: 'Access temporarily blocked due to too many failed attempts.', suggestion: 'Please wait a few minutes before trying again.' }
  if (msg.includes('network-request-failed') || msg.includes('auth/network-request-failed'))
    return { title: 'Network Error', description: 'Unable to connect to the authentication server.', suggestion: 'Check your internet connection and try again.' }
  if (msg.includes('user-disabled') || msg.includes('auth/user-disabled'))
    return { title: 'Account Disabled', description: 'This account has been disabled by an administrator.', suggestion: 'Contact support for assistance.' }
  if (msg.includes('popup-closed-by-user') || msg.includes('auth/popup-closed-by-user'))
    return { title: 'Sign In Cancelled', description: 'The Google sign-in popup was closed before completing.', suggestion: 'Click "Continue with Google" to try again.' }
  if (msg.includes('account-exists-with-different-credential'))
    return { title: 'Account Conflict', description: 'An account already exists with this email but using a different sign-in method.', suggestion: 'Try signing in with email and password instead.' }
  if (msg.includes('requires-recent-login') || msg.includes('auth/requires-recent-login'))
    return { title: 'Session Expired', description: 'Your session has expired for security reasons.', suggestion: 'Please sign in again to continue.' }
  if (msg.includes('admin login') || msg.includes('members only'))
    return { title: 'Wrong Portal', description: msg, suggestion: 'Please navigate to the correct login page for your account type.' }

  // Fallback
  const cleanMsg = msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim()
  const fallbackTitle = context === 'login' ? 'Sign In Failed' : context === 'register' ? 'Registration Failed' : 'Authentication Failed'
  return { title: fallbackTitle, description: cleanMsg || 'An unexpected error occurred.', suggestion: 'Please try again or contact support if the issue persists.' }
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [forgotError, setForgotError] = useState<string | null>(null)
  
  const { signInWithEmail, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLogin(!isLogin)
    setError(null)
    setEmail('')
    setPassword('')
    setDisplayName('')
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isLogin) {
        if (!email || !password) throw new Error('Please enter email and password')
        const role = await signInWithEmail(email, password)
        // Users only — reject admin roles
        if (role !== 'user') {
          await signOut()
          throw new Error('This portal is for members only. Please use the admin login.')
        }
        router.push('/account')
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
        router.push('/account')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      const context = isLogin ? 'login' : 'register'
      setError(parseAuthError(msg, context))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const role = await signInWithGoogle()
      // Users only — reject admin roles
      if (role !== 'user') {
        await signOut()
        throw new Error('This portal is for members only. Please use the admin login.')
      }
      router.push('/account')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed.'
      setError(parseAuthError(msg, 'google'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotMessage(null)
    setForgotLoading(true)

    try {
      if (!forgotEmail) throw new Error('Please enter your email address')
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link')
      setForgotMessage(data.message || 'If an account with that email exists, a password reset link has been sent.')
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setForgotLoading(false)
    }
  }

  const openForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowForgotPassword(true)
    setForgotEmail(email) // pre-fill with current email
    setForgotError(null)
    setForgotMessage(null)
  }

  const closeForgotPassword = () => {
    setShowForgotPassword(false)
    setForgotEmail('')
    setForgotError(null)
    setForgotMessage(null)
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
              Member Sign In
            </p>
          </div>

          {/* Forgot Password View */}
          {showForgotPassword ? (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <p className="font-mono text-[11px] text-[#d0c5b2]/70 uppercase tracking-widest">
                  Reset Your Password
                </p>
                <p className="font-mono text-[10px] text-[#d0c5b2]/40 mt-2">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {/* Success Message */}
              {forgotMessage && (
                <div className="bg-[#1b4332]/30 border border-[#2d6a4f]/40 p-3 text-[#95d5b2] text-[11px] text-center tracking-widest uppercase">
                  {forgotMessage}
                </div>
              )}

              {/* Error Message */}
              {forgotError && (
                <div className="bg-[#93000a]/20 border border-[#93000a]/30 p-3 text-[#ffb4ab] text-[11px] text-center tracking-widest uppercase">
                  {forgotError}
                </div>
              )}

              {!forgotMessage && (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-[#d0c5b2]/60 uppercase tracking-widest focus-within:text-[#e6c364] transition-premium">
                      Email Address
                    </label>
                    <input 
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-transparent border-0 border-b border-[#4d4637]/40 py-1 px-0 text-[#e5e2dd] placeholder:text-[#d0c5b2]/20 input-gold-focus transition-premium text-[13px] focus:ring-0" 
                      placeholder="name@domain.com" 
                      required
                      disabled={forgotLoading}
                      autoFocus
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-[#e6c364]/90 py-2 px-8 text-[#3d2e00] font-mono text-[11px] uppercase tracking-[0.3em] hover:bg-[#e6c364] transition-premium active:scale-[0.99] disabled:opacity-50 flex justify-center items-center h-10"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border-t-2 border-[#3d2e00] rounded-full animate-spin"></span>
                          SENDING...
                        </span>
                      ) : (
                        'SEND RESET LINK'
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center pt-2">
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); closeForgotPassword(); }}
                  className="font-mono text-[11px] text-[#e6c364]/60 hover:text-[#e6c364] transition-premium"
                >
                  ← Back to Sign In
                </a>
              </div>
            </div>
          ) : (
            <>
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
                      <a href="#" onClick={openForgotPassword} className="font-mono text-[10px] text-[#e6c364]/50 hover:text-[#e6c364] transition-premium">
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
            </>
          )}
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

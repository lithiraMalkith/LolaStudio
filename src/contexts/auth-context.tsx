'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { BUILT_IN_ROLE_PERMISSIONS, isBuiltInRole } from '@/lib/permissions'

interface AuthState {
  user: User | null
  role: string | null
  permissions: string[]
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<string>
  signInWithGoogle: () => Promise<string>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    permissions: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult()
          const role = (tokenResult.claims.role as string) || 'user'
          const permissions = resolvePermissions(role)

          setState({
            user,
            role,
            permissions,
            loading: false,
            error: null,
          })
        } catch {
          setState({
            user,
            role: 'user',
            permissions: [],
            loading: false,
            error: null,
          })
        }
      } else {
        setState({
          user: null,
          role: null,
          permissions: [],
          loading: false,
          error: null,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const token = await result.user.getIdToken()
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.customClaimsUpdated) {
          await result.user.getIdToken(true)
        }
        return data.role || 'user'
      } else {
        const data = await response.json().catch(() => ({}))
        await firebaseSignOut(auth)
        throw new Error(data.error || 'Authentication rejected by server.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      throw err
    }
  }

  const signInWithGoogle = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const token = await result.user.getIdToken()
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.customClaimsUpdated) {
          await result.user.getIdToken(true)
        }
        return data.role || 'user'
      } else {
        const data = await response.json().catch(() => ({}))
        await firebaseSignOut(auth)
        throw new Error(data.error || 'Authentication rejected by server.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      throw err
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setState({
      user: null,
      role: null,
      permissions: [],
      loading: false,
      error: null,
    })
  }

  const hasPermission = (permission: string): boolean => {
    if (state.role === 'superadmin') return true
    return state.permissions.includes(permission)
  }

  const isAdmin = state.role !== null && state.role !== 'user'

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        hasPermission,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function resolvePermissions(role: string): string[] {
  if (role === 'superadmin') return Object.values(BUILT_IN_ROLE_PERMISSIONS).flat()
  if (isBuiltInRole(role)) return BUILT_IN_ROLE_PERMISSIONS[role] || []
  // Custom roles will have permissions fetched from Firestore on the server side
  // For the client, we rely on the token claims
  return []
}

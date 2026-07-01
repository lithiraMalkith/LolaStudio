'use client'

import { useEffect, useState, useCallback } from 'react'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

let toastIdCounter = 0
let globalAddToast: ((text: string, type?: 'success' | 'error' | 'info') => void) | null = null

/**
 * Show a toast notification from anywhere.
 * Must have <ToastProvider /> mounted in the component tree.
 */
export function showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
  globalAddToast?.(text, type)
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    globalAddToast = addToast
    return () => { globalAddToast = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-sm pointer-events-none" id="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            px-lg py-md
            border backdrop-blur-xl
            font-mono text-[12px] uppercase tracking-widest
            shadow-2xl
            animate-toast-in
            ${toast.type === 'success'
              ? 'bg-surface-container-lowest/90 border-primary/40 text-primary'
              : toast.type === 'error'
                ? 'bg-surface-container-lowest/90 border-red-500/40 text-red-400'
                : 'bg-surface-container-lowest/90 border-outline-variant/40 text-on-surface'
            }
          `}
        >
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[16px]">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            {toast.text}
          </div>
        </div>
      ))}
    </div>
  )
}

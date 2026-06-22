'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: string
}

export function Modal({ isOpen, onClose, title, children, actions, maxWidth = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div 
        className={cn('bg-brand-surface rounded-xl border border-brand-border max-h-[90vh] overflow-y-auto')}
        style={{ width: '100%', maxWidth: '448px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border sticky top-0 bg-brand-surface">
          <h2 className="text-lg font-semibold text-brand-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-brand-text transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Actions */}
        {actions && <div className="px-6 pb-6 flex items-center gap-3 justify-end">{actions}</div>}
      </div>
    </div>
  )
}

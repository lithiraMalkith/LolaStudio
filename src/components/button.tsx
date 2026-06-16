'use client'

import { cn } from '@/lib/utils'
import { LoaderIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'tertiary'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-lg transition-all inline-flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-brand-gold hover:bg-brand-gold-hover text-brand-bg disabled:bg-brand-gold/50',
    secondary: 'bg-brand-bg border border-brand-gold text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50',
    danger: 'bg-brand-danger hover:bg-brand-danger/90 text-white disabled:bg-brand-danger/50',
    ghost: 'text-brand-muted hover:text-brand-text hover:bg-brand-surface disabled:opacity-50',
    tertiary: 'text-brand-gold bg-transparent border-b border-transparent hover:border-brand-gold rounded-none pb-0.5 px-0 disabled:opacity-50',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
    >
      {isLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

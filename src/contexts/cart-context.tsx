'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth-context'

interface CartItem {
  id: string
  productId: string
  quantity: number
  [key: string]: any
}

interface CartContextType {
  cartCount: number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  const refreshCart = async () => {
    if (!user) {
      setCartCount(0)
      return
    }
    
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      
      if (data.success && data.data) {
        // Calculate total quantity as requested
        const totalQuantity = data.data.reduce((sum: number, item: CartItem) => sum + (item.quantity || 1), 0)
        setCartCount(totalQuantity)
      } else {
        setCartCount(0)
      }
    } catch (error) {
      console.error('Failed to fetch cart count', error)
      setCartCount(0)
    }
  }

  useEffect(() => {
    refreshCart()
  }, [user])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

'use server'

import { adminDb } from '@/lib/firebase-admin'
import type { Product, Order } from '@/types'

/**
 * Fetch popular products based on order frequency.
 * This aggregates all orders and finds the most frequently ordered products.
 */
export async function getPopularProducts(limit: number = 3): Promise<Product[]> {
  try {
    const ordersSnapshot = await adminDb.collection('orders').get()
    const productCounts: Record<string, number> = {}

    ordersSnapshot.forEach((doc) => {
      const order = doc.data() as Order
      if (order.status !== 'cancelled' && order.items) {
        order.items.forEach((item) => {
          productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity
        })
      }
    })

    // Sort product IDs by frequency descending
    const sortedProductIds = Object.keys(productCounts)
      .sort((a, b) => productCounts[b] - productCounts[a])
      .slice(0, limit)

    if (sortedProductIds.length === 0) {
      return []
    }

    // Fetch the products
    // Note: Firestore 'in' query supports up to 10 items
    const productsSnapshot = await adminDb
      .collection('products')
      .where('__name__', 'in', sortedProductIds)
      .where('visibility', '==', 'published')
      .get()

    const products = productsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      }
    }) as Product[]

    // Preserve the sorted order
    return sortedProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined)
  } catch (error) {
    console.error('Error fetching popular products:', error)
    return []
  }
}

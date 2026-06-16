import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/inventory - Get all products for inventory management
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb
        .collection('products')
        .where('visibility', '==', 'published')
        .get()

      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
      }))

      return NextResponse.json({ success: true, data: products })
    } catch (error) {
      console.error('GET /api/inventory error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch inventory' }, { status: 500 })
    }
  }, 'inventory:read')
}

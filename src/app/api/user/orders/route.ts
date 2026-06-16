import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/user/orders — list specific user's orders
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      // Query specific to the user
      const query = adminDb.collection('orders').where('customer.uid', '==', authedReq.user.uid)

      const snapshot = await query.get()
      let orders = snapshot.docs.map((doc) => {
        const data = doc.data() as any
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        }
      })

      // Sort in memory to avoid needing composite index in Firestore
      // (createdAt DESC)
      orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      return NextResponse.json({ success: true, data: orders })
    } catch (error) {
      console.error('GET /api/user/orders error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch user orders' }, { status: 500 })
    }
  })
}

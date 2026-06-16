import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/customers — list all customers
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url)
      const limit = Math.min(Number(searchParams.get('limit') || 50), 200)
      const search = searchParams.get('search')

      let query = adminDb.collection('customers').orderBy('createdAt', 'desc').limit(limit)

      const snapshot = await query.get()
      let customers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
        lastOrderAt: doc.data()?.lastOrderAt?.toDate?.()?.toISOString() || null,
      }))

      // Client-side search (Firestore doesn't support full-text search)
      if (search) {
        const s = search.toLowerCase()
        customers = customers.filter(
          (c: Record<string, unknown>) =>
            (c.name as string)?.toLowerCase().includes(s) ||
            (c.email as string)?.toLowerCase().includes(s) ||
            (c.phone as string)?.includes(s)
        )
      }

      return NextResponse.json({ success: true, data: customers })
    } catch (error) {
      console.error('GET /api/customers error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch customers' }, { status: 500 })
    }
  }, 'customers:read')
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/customers/[id] — get a single customer's details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('customers').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
      }

      const customerData = doc.data()
      
      // Fetch customer orders
      const ordersSnapshot = await adminDb
        .collection('orders')
        .where('customerId', '==', id)
        .orderBy('createdAt', 'desc')
        .get()

      const orders = ordersSnapshot.docs.map((orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
        createdAt: orderDoc.data().createdAt?.toDate?.()?.toISOString() || null,
      }))

      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          ...customerData,
          orders,
          createdAt: customerData?.createdAt?.toDate?.()?.toISOString() || null,
          lastOrderAt: customerData?.lastOrderAt?.toDate?.()?.toISOString() || null,
        },
      })
    } catch (error) {
      console.error('GET /api/customers/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch customer' }, { status: 500 })
    }
  }, 'customers:read')
}

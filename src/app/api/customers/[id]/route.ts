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

// PUT /api/customers/[id] — update customer details (Super Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq) => {
    if (authedReq.user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const body = await req.json()
      
      const updateData: any = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.email !== undefined) updateData.email = body.email
      if (body.phone !== undefined) updateData.phone = body.phone
      if (body.address !== undefined) updateData.address = body.address
      if (body.verificationStatus !== undefined) updateData.verificationStatus = body.verificationStatus

      updateData.updatedAt = new Date().toISOString()

      await adminDb.collection('customers').doc(id).update(updateData)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('PUT /api/customers/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update customer' }, { status: 500 })
    }
  })
}

// DELETE /api/customers/[id] — delete customer (Super Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq) => {
    if (authedReq.user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      await adminDb.collection('customers').doc(id).delete()
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('DELETE /api/customers/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete customer' }, { status: 500 })
    }
  })
}

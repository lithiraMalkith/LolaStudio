import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// PATCH /api/inventory/[productId] - Update stock quantity
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { productId } = await params
      const body = await req.json()
      const { stockQty } = body

      if (typeof stockQty !== 'number' || stockQty < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid stock quantity' },
          { status: 400 }
        )
      }

      const productRef = adminDb.collection('products').doc(productId)
      const doc = await productRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      const availabilityStatus = stockQty === 0 ? 'out_of_stock' : stockQty <= 3 ? 'low_stock' : 'in_stock'

      await productRef.update({
        stockQty,
        availabilityStatus,
        updatedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        data: {
          id: productId,
          stockQty,
          availabilityStatus,
        },
      })
    } catch (error) {
      console.error('PATCH /api/inventory/[productId] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update inventory' }, { status: 500 })
    }
  }, 'inventory:write')
}

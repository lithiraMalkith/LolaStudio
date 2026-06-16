import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/cart — get current user's cart
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const cartRef = adminDb.collection('users').doc(authedReq.user.uid).collection('cart')
      const snapshot = await cartRef.get()
      
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return NextResponse.json({ success: true, data: items })
    } catch (error) {
      console.error('GET /api/cart error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch cart' }, { status: 500 })
    }
  })
}

// POST /api/cart — add or update an item in the cart
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const { productId, quantity } = body

      if (!productId || typeof quantity !== 'number' || quantity < 1) {
        return NextResponse.json({ success: false, error: 'Invalid product or quantity' }, { status: 400 })
      }

      // Verify product exists and check stock
      const productDoc = await adminDb.collection('products').doc(productId).get()
      if (!productDoc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      const product = productDoc.data()!
      if (product.stockQty < quantity) {
        return NextResponse.json({ success: false, error: 'Insufficient stock' }, { status: 400 })
      }

      const cartRef = adminDb.collection('users').doc(authedReq.user.uid).collection('cart').doc(productId)
      
      await cartRef.set({
        productId,
        quantity,
        updatedAt: new Date(),
      }, { merge: true })

      return NextResponse.json({ success: true, message: 'Cart updated' })
    } catch (error) {
      console.error('POST /api/cart error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update cart' }, { status: 500 })
    }
  })
}

// DELETE /api/cart — remove an item or clear cart
export async function DELETE(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { searchParams } = new URL(authedReq.url)
      const productId = searchParams.get('productId')
      
      const cartRef = adminDb.collection('users').doc(authedReq.user.uid).collection('cart')

      if (productId) {
        await cartRef.doc(productId).delete()
        return NextResponse.json({ success: true, message: 'Item removed from cart' })
      } else {
        // Clear entire cart
        const snapshot = await cartRef.get()
        const batch = adminDb.batch()
        snapshot.docs.forEach((doc) => batch.delete(doc.ref))
        await batch.commit()
        return NextResponse.json({ success: true, message: 'Cart cleared' })
      }
    } catch (error) {
      console.error('DELETE /api/cart error:', error)
      return NextResponse.json({ success: false, error: 'Failed to remove from cart' }, { status: 500 })
    }
  })
}

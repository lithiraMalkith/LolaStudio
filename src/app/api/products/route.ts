import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { productSchema } from '@/lib/validations'
import { z } from 'zod' // Add zod import
import { slugify } from '@/lib/utils'

// GET /api/products — list all products (with optional filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const visibility = searchParams.get('visibility')
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100)

    let query: FirebaseFirestore.Query = adminDb.collection('products').orderBy('createdAt', 'desc').limit(limit)

    if (category) query = query.where('category', '==', category)
    if (visibility) query = query.where('visibility', '==', visibility)

    const snapshot = await query.get()
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
    }))

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products — create a new product
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const parsed = productSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const data = parsed.data
      const slug = slugify(data.name)

      // Determine availability status
      let availabilityStatus = 'in_stock'
      if (data.stockQty === 0) availabilityStatus = 'out_of_stock'
      else if (data.stockQty <= 3) availabilityStatus = 'low_stock'

      const productData = {
        ...data,
        slug,
        availabilityStatus,
        image: body.image || (body.images && body.images.length > 0 ? body.images[0] : null),
        images: body.images || (body.image ? [body.image] : []),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: authedReq.user.uid,
      }

      const docRef = await adminDb.collection('products').add(productData)

      return NextResponse.json(
        { success: true, data: { id: docRef.id, ...productData } },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/products error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 })
    }
  }, 'products:write')
}

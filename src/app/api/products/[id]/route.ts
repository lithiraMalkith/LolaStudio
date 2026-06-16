import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { productSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

// GET /api/products/[id] — get a single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const doc = await adminDb.collection('products').doc(id).get()

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const data = doc.data()
    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/[id] — update a product
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const parsed = productSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
      }

      // Fetch existing product to preserve images if not provided
      const existingDoc = await adminDb.collection('products').doc(id).get()
      if (!existingDoc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }
      const existingData = existingDoc.data()

      const data = parsed.data
      const slug = slugify(data.name)

      let availabilityStatus = 'in_stock'
      if (data.stockQty === 0) availabilityStatus = 'out_of_stock'
      else if (data.stockQty <= 3) availabilityStatus = 'low_stock'

      // Preserve existing images if not provided in the update
      const images = body.images !== undefined
          ? body.images
          : (existingData?.images || [])

      const image = body.image !== undefined
          ? body.image
          : (images.length > 0 ? images[0] : existingData?.image || null)

      const updateData = {
        ...data,
        slug,
        availabilityStatus,
        image,
        images,
        updatedAt: new Date(),
      }

      await adminDb.collection('products').doc(id).update(updateData)

      return NextResponse.json({ success: true, data: { id, ...updateData } })
    } catch (error) {
      console.error('PUT /api/products/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 })
    }
  }, 'products:write')
}

// DELETE /api/products/[id] — delete a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('products').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      await adminDb.collection('products').doc(id).delete()

      return NextResponse.json({ success: true, message: 'Product deleted' })
    } catch (error) {
      console.error('DELETE /api/products/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 })
    }
  }, 'products:delete')
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { categorySchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

// GET /api/categories — list all categories
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('categories').orderBy('order', 'asc').get()
      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
      }))

      return NextResponse.json({ success: true, data: categories })
    } catch (error) {
      console.error('GET /api/categories error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
    }
  }, 'categories:read')
}

// POST /api/categories — create a new category
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const parsed = categorySchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      // Get next order number
      const countSnapshot = await adminDb.collection('categories').count().get()
      const order = countSnapshot.data().count + 1

      const categoryData = {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        description: parsed.data.description || '',
        subCategories: [],
        order,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await adminDb.collection('categories').add(categoryData)

      return NextResponse.json(
        { success: true, data: { id: docRef.id, ...categoryData } },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/categories error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
    }
  }, 'categories:write')
}

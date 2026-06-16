import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { categorySchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

// GET /api/categories/[id] — get a single category
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('categories').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
        },
      })
    } catch (error) {
      console.error('GET /api/categories/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch category' }, { status: 500 })
    }
  }, 'categories:read')
}

// PUT /api/categories/[id] — update a category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await req.json()
      const { name, description } = body

      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'Category name is required and must be at least 2 characters' },
          { status: 400 }
        )
      }

      const categoryRef = adminDb.collection('categories').doc(id)
      const doc = await categoryRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {
        name: name.trim(),
        slug: slugify(name.trim()),
        updatedAt: new Date(),
        updatedBy: authedReq.user.uid,
      }

      if (description !== undefined) {
        updateData.description = description
      }

      await categoryRef.update(updateData)

      const updatedDoc = await categoryRef.get()
      return NextResponse.json({
        success: true,
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
          createdAt: updatedDoc.data()?.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: updatedDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
        },
      })
    } catch (error) {
      console.error('PUT /api/categories/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
    }
  }, 'categories:write')
}

// DELETE /api/categories/[id] — delete a category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const categoryRef = adminDb.collection('categories').doc(id)
      const doc = await categoryRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }

      // Delete the category
      await categoryRef.delete()

      return NextResponse.json({
        success: true,
        data: { id, message: 'Category deleted successfully' },
      })
    } catch (error) {
      console.error('DELETE /api/categories/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
    }
  }, 'categories:write')
}

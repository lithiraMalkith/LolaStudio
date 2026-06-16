import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { slugify } from '@/lib/utils'
import { randomUUID } from 'crypto'

// POST /api/categories/[id]/subcategories — add a sub-category
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await req.json()
      const { name } = body

      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: 'Sub-category name is required and must be at least 2 characters' },
          { status: 400 }
        )
      }

      const categoryRef = adminDb.collection('categories').doc(id)
      const categoryDoc = await categoryRef.get()

      if (!categoryDoc.exists) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }

      const categoryData = categoryDoc.data() || {}
      const subCategories = categoryData.subCategories || []

      // Create new sub-category
      const newSubCategory = {
        id: randomUUID(),
        name: name.trim(),
        slug: slugify(name.trim()),
        createdAt: new Date(),
      }

      // Add to array and update
      await categoryRef.update({
        subCategories: [...subCategories, newSubCategory],
        updatedAt: new Date(),
        updatedBy: authedReq.user.uid,
      })

      return NextResponse.json(
        { success: true, data: newSubCategory },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/categories/[id]/subcategories error:', error)
      return NextResponse.json({ success: false, error: 'Failed to add sub-category' }, { status: 500 })
    }
  }, 'categories:write')
}

// PATCH /api/categories/[id]/subcategories — update or delete a sub-category
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await req.json()
      const { subCategoryId, action, name } = body

      if (!subCategoryId || !action) {
        return NextResponse.json(
          { success: false, error: 'subCategoryId and action are required' },
          { status: 400 }
        )
      }

      const categoryRef = adminDb.collection('categories').doc(id)
      const categoryDoc = await categoryRef.get()

      if (!categoryDoc.exists) {
        return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
      }

      const categoryData = categoryDoc.data() || {}
      let subCategories = categoryData.subCategories || []

      if (action === 'delete') {
        subCategories = subCategories.filter((sub: any) => sub.id !== subCategoryId)
      } else if (action === 'update' && name) {
        subCategories = subCategories.map((sub: any) =>
          sub.id === subCategoryId
            ? { ...sub, name: name.trim(), slug: slugify(name.trim()) }
            : sub
        )
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid action or missing name for update' },
          { status: 400 }
        )
      }

      await categoryRef.update({
        subCategories,
        updatedAt: new Date(),
        updatedBy: authedReq.user.uid,
      })

      return NextResponse.json({
        success: true,
        data: subCategories.find((sub: any) => sub.id === subCategoryId),
      })
    } catch (error) {
      console.error('PATCH /api/categories/[id]/subcategories error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update sub-category' }, { status: 500 })
    }
  }, 'categories:write')
}

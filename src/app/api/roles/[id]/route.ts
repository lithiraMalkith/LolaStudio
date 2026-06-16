import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { customRoleSchema } from '@/lib/validations'

// GET /api/roles/[id] — get a single role
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('roles').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
        },
      })
    } catch (error) {
      console.error('GET /api/roles/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch role' }, { status: 500 })
    }
  }, 'roles:read')
}

// PUT /api/roles/[id] — update a custom role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await req.json()
      const parsed = customRoleSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const roleRef = adminDb.collection('roles').doc(id)
      const doc = await roleRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
      }

      // Prevent editing built-in roles
      if (doc.data()?.isBuiltIn) {
        return NextResponse.json(
          { success: false, error: 'Cannot edit built-in roles' },
          { status: 403 }
        )
      }

      await roleRef.update({
        name: parsed.data.name,
        permissions: parsed.data.permissions,
        updatedAt: new Date(),
        updatedBy: authedReq.user.uid,
      })

      const updatedDoc = await roleRef.get()
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
      console.error('PUT /api/roles/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 })
    }
  }, 'roles:write')
}

// DELETE /api/roles/[id] — delete a custom role
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const roleRef = adminDb.collection('roles').doc(id)
      const doc = await roleRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
      }

      // Prevent deleting built-in roles
      if (doc.data()?.isBuiltIn) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete built-in roles' },
          { status: 403 }
        )
      }

      // Check if any users have this role
      const usersSnapshot = await adminDb
        .collection('users')
        .where('role', '==', id)
        .get()

      if (!usersSnapshot.empty) {
        return NextResponse.json(
          { success: false, error: `Cannot delete role: ${usersSnapshot.docs.length} user(s) assigned to this role` },
          { status: 409 }
        )
      }

      await roleRef.delete()

      return NextResponse.json({
        success: true,
        data: { id, message: 'Role deleted successfully' },
      })
    } catch (error) {
      console.error('DELETE /api/roles/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 })
    }
  }, 'roles:write')
}

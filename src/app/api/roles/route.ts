import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import { customRoleSchema } from '@/lib/validations'

// GET /api/roles — list all roles (built-in + custom)
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('roles').get()
      const customRoles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
      }))

      return NextResponse.json({ success: true, data: customRoles })
    } catch (error) {
      console.error('GET /api/roles error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 })
    }
  }, 'roles:read')
}

// POST /api/roles — create a custom role
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const parsed = customRoleSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      // Generate a slug-like ID for the role
      const roleId = parsed.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      // Check if role already exists
      const existing = await adminDb.collection('roles').doc(roleId).get()
      if (existing.exists) {
        return NextResponse.json(
          { success: false, error: 'A role with this name already exists' },
          { status: 409 }
        )
      }

      const roleData = {
        name: parsed.data.name,
        permissions: parsed.data.permissions,
        createdBy: authedReq.user.uid,
        createdAt: new Date(),
        isCustom: true,
      }

      await adminDb.collection('roles').doc(roleId).set(roleData)

      return NextResponse.json(
        { success: true, data: { id: roleId, ...roleData } },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/roles error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create role' }, { status: 500 })
    }
  }, 'roles:write')
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// Helper function for updating user
async function updateUserHandler(uid: string, body: Record<string, unknown>, authedReq: AuthedRequest) {
  const { role, isActive } = body

  // Don't allow modifying the requesting user's own role
  if (uid === authedReq.user.uid) {
    return NextResponse.json(
      { success: false, error: 'Cannot modify your own role' },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {}

  if (role !== undefined) {
    // Update Firebase Auth custom claims
    await adminAuth.setCustomUserClaims(uid, { role })
    updateData.role = role
  }

  if (isActive !== undefined) {
    // Disable/enable the Firebase Auth account
    await adminAuth.updateUser(uid, { disabled: !isActive })
    updateData.isActive = isActive
  }

  if (Object.keys(updateData).length > 0) {
    await adminDb.collection('users').doc(uid).update({
      ...updateData,
      updatedAt: new Date(),
      updatedBy: authedReq.user.uid,
    })
  }

  return NextResponse.json({ success: true, data: { uid, ...updateData } })
}

// PUT /api/users/[uid] — update user role or status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { uid } = await params
      const body = await authedReq.json()
      return await updateUserHandler(uid, body, authedReq)
    } catch (error) {
      console.error('PUT /api/users/[uid] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
    }
  }, 'users:write')
}

// PATCH /api/users/[uid] — update user role or status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { uid } = await params
      const body = await authedReq.json()
      return await updateUserHandler(uid, body, authedReq)
    } catch (error) {
      console.error('PATCH /api/users/[uid] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
    }
  }, 'users:write')
}

// DELETE /api/users/[uid] — revoke user access
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { uid } = await params

      if (uid === authedReq.user.uid) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete your own account' },
          { status: 400 }
        )
      }

      // Disable the Firebase Auth account (don't fully delete — preserve history)
      await adminAuth.updateUser(uid, { disabled: true })
      await adminAuth.setCustomUserClaims(uid, { role: 'revoked' })

      // Update Firestore
      await adminDb.collection('users').doc(uid).update({
        isActive: false,
        role: 'revoked',
        revokedAt: new Date(),
        revokedBy: authedReq.user.uid,
      })

      return NextResponse.json({ success: true, message: 'User access revoked' })
    } catch (error) {
      console.error('DELETE /api/users/[uid] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to revoke user access' }, { status: 500 })
    }
  }, 'users:write')
}

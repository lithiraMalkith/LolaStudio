import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// PUT /api/user/profile — update user's own profile
export async function PUT(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { displayName, email, phoneNumber } = await authedReq.json()
      const uid = authedReq.user.uid

      const updateData: any = {}
      if (displayName !== undefined) updateData.displayName = displayName
      if (email !== undefined) updateData.email = email
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null

      // Update Firebase Auth
      await adminAuth.updateUser(uid, updateData)

      // Update Firestore user document
      const dbUpdate: any = {}
      if (displayName !== undefined) dbUpdate.displayName = displayName
      if (email !== undefined) dbUpdate.email = email
      if (phoneNumber !== undefined) dbUpdate.phoneNumber = phoneNumber || null

      // Merge true ensures we don't overwrite the whole document
      await adminDb.collection('users').doc(uid).set(dbUpdate, { merge: true })

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Update profile error:', error)
      return NextResponse.json({ success: false, error: error.message || 'Failed to update profile' }, { status: 500 })
    }
  })
}

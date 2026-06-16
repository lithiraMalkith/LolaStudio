import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

// GET /api/users/profile — get current user profile
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const userDoc = await adminDb.collection('users').doc(authedReq.user.uid).get()
      if (!userDoc.exists) {
        return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: { uid: userDoc.id, ...userDoc.data() } })
    } catch (error) {
      console.error('GET /api/users/profile error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch user profile' }, { status: 500 })
    }
  })
}

// PUT /api/users/profile — update current user profile
export async function PUT(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const { displayName, phone, address } = body

      // Update in Firebase Auth
      if (displayName) {
        await adminAuth.updateUser(authedReq.user.uid, { displayName })
      }

      // Update in Firestore
      const userRef = adminDb.collection('users').doc(authedReq.user.uid)
      
      const updateData: any = { updatedAt: new Date() }
      if (displayName) updateData.displayName = displayName
      if (phone !== undefined) updateData.phone = phone
      if (address !== undefined) updateData.address = address

      await userRef.set(updateData, { merge: true })

      return NextResponse.json({ success: true, message: 'Profile updated successfully' })
    } catch (error) {
      console.error('PUT /api/users/profile error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update user profile' }, { status: 500 })
    }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/user/profile — fetch user's profile from Firestore
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const uid = authedReq.user.uid
      const userDoc = await adminDb.collection('users').doc(uid).get()
      
      if (!userDoc.exists) {
        return NextResponse.json({ 
          success: true, 
          data: {
            displayName: authedReq.user.name || '',
            email: authedReq.user.email || '',
            phoneNumber: authedReq.user.phone_number || ''
          } 
        })
      }

      return NextResponse.json({ success: true, data: userDoc.data() })
    } catch (error: any) {
      console.error('Fetch profile error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
    }
  })
}

// PUT /api/user/profile — update user's own profile
export async function PUT(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { displayName, email, phoneNumber, address } = await authedReq.json()
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
      if (address !== undefined) dbUpdate.address = address

      // Merge true ensures we don't overwrite the whole document
      await adminDb.collection('users').doc(uid).set(dbUpdate, { merge: true })

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Update profile error:', error)
      return NextResponse.json({ success: false, error: error.message || 'Failed to update profile' }, { status: 500 })
    }
  })
}

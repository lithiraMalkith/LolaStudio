import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { userInviteSchema } from '@/lib/validations'

// GET /api/users — list all admin users
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const snapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get()
      const users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
        lastLoginAt: doc.data()?.lastLoginAt?.toDate?.()?.toISOString() || null,
      }))

      return NextResponse.json({ success: true, data: users })
    } catch (error) {
      console.error('GET /api/users error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
    }
  }, 'users:read')
}

// POST /api/users — invite a new user
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      const parsed = userInviteSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { email, displayName, role } = parsed.data

      // Create the user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email,
        displayName,
        emailVerified: false,
      })

      // Set custom claims (role)
      await adminAuth.setCustomUserClaims(userRecord.uid, { role })

      // Store user profile in Firestore
      await adminDb.collection('users').doc(userRecord.uid).set({
        email,
        displayName,
        role,
        isActive: true,
        createdAt: new Date(),
        createdBy: authedReq.user.uid,
      })

      // Generate password reset link (acts as the invite email)
      const resetLink = await adminAuth.generatePasswordResetLink(email)

      return NextResponse.json(
        {
          success: true,
          data: {
            uid: userRecord.uid,
            email,
            displayName,
            role,
            resetLink, // In production, send this via Resend
          },
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/users error:', error)
      const message = error instanceof Error ? error.message : 'Failed to invite user'
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
  }, 'users:write')
}

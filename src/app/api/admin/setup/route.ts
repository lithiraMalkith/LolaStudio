import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * POST /api/admin/setup
 * 
 * WARNING: This is a setup/dev endpoint only!
 * Delete this in production or protect it heavily.
 * 
 * Creates test users and sets their roles.
 * Usage: Send POST request with user data
 * 
 * Body:
 * {
 *   "email": "admin@lolastudio.com",
 *   "password": "SecurePassword123!",
 *   "role": "superadmin" | "manager" | "fulfillment" | "support"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, role } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing email, password, or role' },
        { status: 400 }
      )
    }

    if (!['superadmin', 'manager', 'fulfillment', 'support'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: superadmin, manager, fulfillment, or support' },
        { status: 400 }
      )
    }

    // Check if user already exists
    try {
      const existingUser = await adminAuth.getUserByEmail(email)
      return NextResponse.json(
        { error: `User ${email} already exists. UID: ${existingUser.uid}` },
        { status: 409 }
      )
    } catch (error: any) {
      // User doesn't exist, which is good — continue
      if (error.code !== 'auth/user-not-found') {
        throw error
      }
    }

    // Create new user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: email.split('@')[0],
    })

    // Set custom claims (role)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role })

    // Create user profile in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: email.split('@')[0],
      role,
      phone: '',
      createdAt: new Date(),
      isActive: true,
    })

    return NextResponse.json({
      success: true,
      message: `User created successfully`,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        role,
        customClaims: userRecord.customClaims,
      },
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/setup?action=list
 * Lists all admin users (for testing)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'list') {
      const snapshot = await adminDb.collection('users').get()
      const users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        email: doc.data()?.email,
        role: doc.data()?.role,
        displayName: doc.data()?.displayName,
        isActive: doc.data()?.isActive,
      }))

      return NextResponse.json({ success: true, data: users })
    }

    return NextResponse.json(
      { error: 'Use ?action=list to list users' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

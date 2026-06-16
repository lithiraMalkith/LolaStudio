import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

// POST /api/auth/session — create a session cookie from ID token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID token required' }, { status: 400 })
    }

    // Verify the ID token
    const decoded = await adminAuth.verifyIdToken(idToken)

    // Create session cookie (5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days in ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    // Set the cookie
    const cookieStore = await cookies()
    cookieStore.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      data: {
        uid: decoded.uid,
        role: decoded.role || 'user',
      },
    })
  } catch (error) {
    console.error('POST /api/auth/session error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 401 })
  }
}

// DELETE /api/auth/session — clear the session cookie
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('__session')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/auth/session error:', error)
    return NextResponse.json({ success: false, error: 'Failed to clear session' }, { status: 500 })
  }
}

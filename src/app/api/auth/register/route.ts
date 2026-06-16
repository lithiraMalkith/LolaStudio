import { NextRequest, NextResponse } from 'next/server'
import { createUserWithRole } from '@/lib/admin-service'

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json()

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Securely create user and force the 'user' role.
    const result = await createUserWithRole(email, password, displayName, 'user')

    return NextResponse.json({ success: true, uid: result.uid, email: result.email })
  } catch (error: any) {
    console.error('Registration Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}

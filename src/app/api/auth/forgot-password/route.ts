import { NextRequest, NextResponse } from 'next/server'

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

// POST /api/auth/forgot-password — Send a password reset email
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    // Use Firebase Auth REST API to actually send the password reset email.
    // This triggers Firebase's built-in email template delivery.
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email,
          }),
        }
      )

      if (!response.ok) {
        // Silently ignore errors (e.g. EMAIL_NOT_FOUND) to prevent email enumeration.
        // We still return a success response to the client.
        const errorData = await response.json().catch(() => ({}))
        console.log('Password reset response (non-sensitive):', errorData?.error?.message || 'unknown')
      }
    } catch {
      // Network/fetch errors — silently ignore for security
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot Password Error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}

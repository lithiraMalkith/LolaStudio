import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { BUILT_IN_ROLE_PERMISSIONS } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'
import type { DecodedIdToken } from 'firebase-admin/auth'

export type AuthedRequest = NextRequest & { user: DecodedIdToken }

/**
 * Auth middleware wrapper for all API routes.
 * Verifies Firebase ID token and optionally checks permissions.
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthedRequest) => Promise<NextResponse>,
  requiredPermission?: string
): Promise<NextResponse> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — no token provided' },
      { status: 401 }
    )
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const role = (decoded.role as string) || 'user'

    if (requiredPermission) {
      const hasAccess = await checkPermission(role, requiredPermission)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Forbidden — insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Attach user to request
    ;(req as AuthedRequest).user = decoded
    return await handler(req as AuthedRequest)
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid token' },
      { status: 401 }
    )
  }
}

/**
 * Check if a role has a specific permission.
 * Superadmin bypasses all checks.
 * Built-in roles check against BUILT_IN_ROLE_PERMISSIONS.
 * Custom roles are fetched from Firestore /roles/{roleId}.
 */
async function checkPermission(role: string, permission: string): Promise<boolean> {
  // Superadmin bypasses everything
  if (role === 'superadmin') return true

  // Check built-in roles
  const builtIn = BUILT_IN_ROLE_PERMISSIONS[role]
  if (builtIn) {
    return builtIn.includes(permission as never)
  }

  // Custom role — fetch from Firestore
  try {
    const doc = await adminDb.collection('roles').doc(role).get()
    const data = doc.data()
    return data?.permissions?.includes(permission) ?? false
  } catch {
    return false
  }
}

/**
 * Helper to extract user from session cookie (for middleware.ts)
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true)
  } catch {
    return null
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

/**
 * Proxy for Next.js App Router
 * 
 * Note: Firebase Auth tokens are stored client-side (memory/localStorage),
 * not in cookies by default. So we let the client-side auth-context.tsx
 * handle redirects via useAuth() + useRouter() in layout/page components.
 * 
 * This proxy mainly serves for:
 * 1. Adding security headers
 * 2. API route protection (done via withAuth middleware instead)
 * 3. Logging/monitoring
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Optional: Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Authorization is handled by:
  // 1. Client-side: auth-context.tsx checks role and redirects
  // 2. Server-side: API routes use withAuth middleware from auth-middleware.ts
  //
  // This allows:
  // - Fast client-side redirects (no server round-trip)
  // - Server-side API protection
  // - Graceful permission handling

  return response
}

export const config = {
  // Matcher: define which routes should use proxy
  // Currently disabled since client-side auth handles redirects better
  // matcher: ['/admin/:path*', '/login'],
  
  // If you want to protect routes at proxy level, uncomment above
  // and use the session cookie approach below:
  matcher: [],
}

/**
 * Alternative: Session Cookie Approach (if needed)
 * 
 * If you want to verify auth at proxy level:
 * 
 * 1. After Firebase login, create session cookie server-side:
 *    // In a Cloud Function or API route
 *    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
 *      expiresIn: 60 * 60 * 24 * 5 * 1000 // 5 days
 *    })
 *    res.cookie('__session', sessionCookie, { httpOnly: true, secure: true })
 * 
 * 2. Then in proxy, verify it:
 *    const sessionCookie = request.cookies.get('__session')?.value
 *    if (sessionCookie) {
 *      try {
 *        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
 *        // User authenticated, continue
 *      } catch (error) {
 *        // Invalid session, redirect to login
 *      }
 *    }
 * 
 * For now, we're keeping it simple with client-side auth redirects.
 */

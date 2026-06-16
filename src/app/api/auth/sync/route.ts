import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// POST /api/auth/sync — Sync user's Firestore role with Firebase Auth custom claims
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const { uid, email, name, picture } = decodedToken

    const userRef = adminDb.collection('users').doc(uid)
    const userDoc = await userRef.get()

    let roleToSet = 'user'
    let customClaimsUpdated = false

    if (!userDoc.exists) {
      // New user signup (e.g. via Google OAuth)
      // We automatically assign them the 'user' role and create their profile
      roleToSet = 'user'
      const newUserProfile = {
        uid,
        email: email || '',
        displayName: name || '',
        photoURL: picture || '',
        role: roleToSet,
        createdAt: new Date(),
        isActive: true,
      }
      await userRef.set(newUserProfile)
      await adminAuth.setCustomUserClaims(uid, { role: roleToSet })
      customClaimsUpdated = true
    } else {
      // User exists in DB, ensure custom claims match DB role
      const dbData = userDoc.data()
      const dbRole = dbData?.role || 'user'
      
      if (decodedToken.role !== dbRole) {
        await adminAuth.setCustomUserClaims(uid, { role: dbRole })
        customClaimsUpdated = true
      }
      roleToSet = dbRole
    }

    return NextResponse.json({ 
      success: true, 
      customClaimsUpdated, 
      role: roleToSet 
    })

  } catch (error) {
    console.error('Sync Auth Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to sync auth' }, { status: 500 })
  }
}

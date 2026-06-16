import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/settings — get site settings
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const doc = await adminDb.collection('settings').doc('site').get()

      if (!doc.exists) {
        // Return defaults if no settings exist yet
        return NextResponse.json({
          success: true,
          data: {
            siteName: 'Lola Studio',
            siteDescription: 'Handmade home décor & spiritual goods from Negombo, Sri Lanka',
            ownerEmail: '',
            ownerPhone: '',
            currency: 'LKR',
            codEnabled: true,
            deliveryZones: [],
            socialLinks: { tiktok: '', instagram: '', facebook: '' },
            metaPixelId: '',
            tiktokPixelId: '',
          },
        })
      }

      return NextResponse.json({ success: true, data: doc.data() })
    } catch (error) {
      console.error('GET /api/settings error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
    }
  }, 'settings:read')
}

// PUT /api/settings — update site settings
export async function PUT(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()

      await adminDb.collection('settings').doc('site').set(
        {
          ...body,
          updatedAt: new Date(),
          updatedBy: authedReq.user.uid,
        },
        { merge: true }
      )

      return NextResponse.json({ success: true, message: 'Settings updated' })
    } catch (error) {
      console.error('PUT /api/settings error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
    }
  }, 'settings:write')
}

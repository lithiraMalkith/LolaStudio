import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/messages — List messages (admin/support only)
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      // Must have messages:read permission or be superadmin
      const hasPermission = 
        authedReq.user.role === 'superadmin' || 
        authedReq.user.permissions?.includes('messages:read')

      if (!hasPermission) {
        return NextResponse.json({ success: false, error: 'Unauthorized to read messages' }, { status: 403 })
      }

      const snapshot = await adminDb.collection('messages').orderBy('createdAt', 'desc').get()
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || null,
      }))

      return NextResponse.json({ success: true, data: messages })
    } catch (error: any) {
      console.error('GET /api/messages error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
    }
  })
}

// POST /api/messages — Send a new message (any logged-in user)
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { name, email, subject, message } = await authedReq.json()
      
      // Basic validation
      if (!name || !email || !subject || !message) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
      }

      const uid = authedReq.user.uid
      const now = new Date()

      const newMessage = {
        uid,
        name,
        email,
        subject,
        message,
        status: 'unread',
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await adminDb.collection('messages').add(newMessage)

      return NextResponse.json({ 
        success: true, 
        data: { id: docRef.id, ...newMessage, createdAt: now.toISOString(), updatedAt: now.toISOString() } 
      })
    } catch (error: any) {
      console.error('POST /api/messages error:', error)
      return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
    }
  })
}

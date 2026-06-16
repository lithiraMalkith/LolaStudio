import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// PUT /api/messages/[id] — Update message status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      // Must have messages:write permission or be superadmin
      const hasPermission = 
        authedReq.user.role === 'superadmin' || 
        authedReq.user.permissions?.includes('messages:write')

      if (!hasPermission) {
        return NextResponse.json({ success: false, error: 'Unauthorized to update messages' }, { status: 403 })
      }

      const { status } = await authedReq.json()
      if (!status || !['unread', 'read', 'archived'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
      }

      const docRef = adminDb.collection('messages').doc(resolvedParams.id)
      const doc = await docRef.get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 })
      }

      const updateData = {
        status,
        updatedAt: new Date(),
        ...(status === 'read' && doc.data()?.status === 'unread' ? {
          readBy: authedReq.user.uid,
          readAt: new Date(),
        } : {})
      }

      await docRef.update(updateData)

      return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data(), ...updateData } })
    } catch (error: any) {
      console.error('PUT /api/messages/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update message' }, { status: 500 })
    }
  })
}

// DELETE /api/messages/[id] — Delete message
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      // Must have messages:delete permission or be superadmin
      const hasPermission = 
        authedReq.user.role === 'superadmin' || 
        authedReq.user.permissions?.includes('messages:delete')

      if (!hasPermission) {
        return NextResponse.json({ success: false, error: 'Unauthorized to delete messages' }, { status: 403 })
      }

      await adminDb.collection('messages').doc(resolvedParams.id).delete()

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('DELETE /api/messages/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete message' }, { status: 500 })
    }
  })
}

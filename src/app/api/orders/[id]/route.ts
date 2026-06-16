import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'
import {
  sendOrderProcessingEmail,
  sendOrderDispatchedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
} from '@/lib/email'
import type { OrderStatus } from '@/types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'processing', 'dispatched', 'delivered', 'cancelled']

// Proper status transition flow
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'dispatched', 'delivered', 'cancelled'],
  processing: ['dispatched', 'delivered', 'cancelled'],
  dispatched: ['delivered', 'cancelled'],
  delivered: [], // terminal state
  cancelled: [], // terminal state
}

// GET /api/orders/[id] — get a single order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const { id } = await params
      const doc = await adminDb.collection('orders').doc(id).get()

      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      const data = doc.data()
      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
        },
      })
    } catch (error) {
      console.error('GET /api/orders/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 })
    }
  }, 'orders:read')
}

// PATCH /api/orders/[id] — update order status with email notifications
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const { status, note, cancellationReason } = body

      if (!status || !VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }

      const doc = await adminDb.collection('orders').doc(id).get()
      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      const currentData = doc.data()!
      const currentStatus = currentData.status
      const customerEmail = currentData.customerEmail
      const customerName = currentData.customerName
      const orderRef = currentData.orderRef

      // Validate status transition
      if (!STATUS_TRANSITIONS[currentStatus as OrderStatus]?.includes(status as OrderStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition from '${currentStatus}' to '${status}'. Allowed: ${STATUS_TRANSITIONS[currentStatus as OrderStatus]?.join(', ') || 'none (terminal state)'}`,
          },
          { status: 400 }
        )
      }

      const statusEntry: Record<string, unknown> = {
        status,
        timestamp: new Date(),
        updatedBy: authedReq.user.uid,
      }

      if (note) {
        statusEntry.note = note
      }

      const updateData: Record<string, unknown> = {
        status,
        statusHistory: [...(currentData.statusHistory || []), statusEntry],
        updatedAt: new Date(),
      }

      // Handle cancellation
      if (status === 'cancelled' && cancellationReason) {
        updateData.cancellationReason = cancellationReason

        // Restore stock for cancelled orders
        if (currentData.items && Array.isArray(currentData.items)) {
          for (const item of currentData.items) {
            const productDoc = await adminDb.collection('products').doc(item.productId).get()
            if (productDoc.exists) {
              const product = productDoc.data()!
              const newQty = (product.stockQty || 0) + item.quantity
              await productDoc.ref.update({
                stockQty: newQty,
                availabilityStatus: newQty > 3 ? 'in_stock' : newQty > 0 ? 'low_stock' : 'out_of_stock',
                updatedAt: new Date(),
              })
            }
          }
        }
      }

      // Update order in database
      await adminDb.collection('orders').doc(id).update(updateData)

      // Send appropriate email notification based on status transition
      try {
        if (status === 'processing') {
          await sendOrderProcessingEmail({
            orderRef,
            customerName,
            customerEmail,
          })
        } else if (status === 'dispatched') {
          await sendOrderDispatchedEmail({
            orderRef,
            customerName,
            customerEmail,
            trackingNumber: currentData.trackingNumber,
            estimatedDeliveryDate: currentData.estimatedDeliveryDate,
            deliveryAddress: currentData.deliveryAddress,
          })
        } else if (status === 'delivered') {
          await sendOrderDeliveredEmail({
            orderRef,
            customerName,
            customerEmail,
            deliveryDate: new Date().toLocaleDateString('en-LK'),
          })
        } else if (status === 'cancelled') {
          await sendOrderCancelledEmail({
            orderRef,
            customerName,
            customerEmail,
            cancellationReason,
            refundAmount: currentData.total,
          })
        }
      } catch (emailError) {
        console.error('Email send error during status update:', emailError)
        // Don't fail the order update if email fails - log and continue
      }

      return NextResponse.json({
        success: true,
        data: {
          id,
          status,
          previousStatus: currentStatus,
          emailSent: true,
        },
      })
    } catch (error) {
      console.error('PATCH /api/orders/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
    }
  }, 'orders:write')
}

// PUT /api/orders/[id] — update customer and delivery details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { id } = await params
      const body = await authedReq.json()
      const {
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        deliveryCity,
        deliveryPostCode,
        trackingNumber,
        estimatedDeliveryDate,
        notes,
      } = body

      const doc = await adminDb.collection('orders').doc(id).get()
      if (!doc.exists) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      const currentData = doc.data()!
      const currentStatus = currentData.status

      // Only allow editing customer/delivery details if order is in pending or processing status
      if (currentStatus !== 'pending' && currentStatus !== 'processing') {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot update details for orders in '${currentStatus}' status. Only 'pending' and 'processing' orders can be edited.`,
          },
          { status: 400 }
        )
      }

      const updateData: Record<string, unknown> = {}

      // Update customer details if provided
      if (customerName) updateData.customerName = customerName
      if (customerEmail) updateData.customerEmail = customerEmail
      if (customerPhone) updateData.customerPhone = customerPhone

      // Update delivery details if provided
      if (deliveryAddress) updateData.deliveryAddress = deliveryAddress
      if (deliveryCity) updateData.deliveryCity = deliveryCity
      if (deliveryPostCode) updateData.deliveryPostCode = deliveryPostCode
      if (trackingNumber) updateData.trackingNumber = trackingNumber
      if (estimatedDeliveryDate) updateData.estimatedDeliveryDate = estimatedDeliveryDate
      if (notes) updateData.notes = notes

      // Add audit trail
      updateData.updatedAt = new Date()
      updateData.updatedBy = authedReq.user.uid

      // Update order
      await adminDb.collection('orders').doc(id).update(updateData)

      return NextResponse.json({
        success: true,
        data: {
          id,
          message: 'Order details updated successfully',
          updatedFields: Object.keys(updateData).filter((key) => key !== 'updatedAt' && key !== 'updatedBy'),
        },
      })
    } catch (error) {
      console.error('PUT /api/orders/[id] error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update order details' }, { status: 500 })
    }
  }, 'orders:write')
}

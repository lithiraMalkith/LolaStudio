import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthedRequest } from '@/lib/auth-middleware'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { checkoutSchema } from '@/lib/validations'
import { generateOrderRef } from '@/lib/utils'
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/email'
import type { Order, OrderItem } from '@/types'

// GET /api/orders — list all orders (with filters)
export async function GET(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const { searchParams } = new URL(authedReq.url)
      const status = searchParams.get('status')
      const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

      let query: FirebaseFirestore.Query = adminDb.collection('orders').orderBy('createdAt', 'desc')

      // Restrict to admin/manager/superadmin
      const hasAdminRead = authedReq.user.role === 'admin' || authedReq.user.role === 'manager' || authedReq.user.role === 'superadmin'
      if (!hasAdminRead) {
        return NextResponse.json({ success: false, error: 'Unauthorized to view all orders' }, { status: 403 })
      }

      query = query.limit(limit)

      // Note: filtering by status client-side to avoid composite index requirement
      const snapshot = await query.get()
      let orders = snapshot.docs.map((doc) => {
        const data = doc.data() as any
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        }
      })

      if (status && status !== 'all') {
        orders = orders.filter((o) => (o as any).status === status)
      }

      return NextResponse.json({ success: true, data: orders })
    } catch (error) {
      console.error('GET /api/orders error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 })
    }
  }) // no required permission parameter, so both users and admins can hit this
}

// POST /api/orders — create order (admin creation OR authenticated customer checkout)
export async function POST(req: NextRequest) {
  return withAuth(req, async (authedReq: AuthedRequest) => {
    try {
      const body = await authedReq.json()
      
      // Admin creation flow (differentiated by checking for custom deliveryFee or specific admin payload structure)
      const isAdminCreation = authedReq.user.role === 'admin' || authedReq.user.role === 'manager' || authedReq.user.role === 'superadmin'
      
      if (isAdminCreation && body.customer && body.deliveryAddress) {
        const { items, customer, deliveryAddress, notes, deliveryFee: customDeliveryFee } = body

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Order must contain at least one item' },
            { status: 400 }
          )
        }

        if (!customer || !customer.name || !customer.email || !customer.phone) {
          return NextResponse.json(
            { success: false, error: 'Invalid customer information' },
            { status: 400 }
          )
        }

        if (
          !deliveryAddress ||
          !deliveryAddress.addressLine1 ||
          !deliveryAddress.city ||
          !deliveryAddress.postalCode
        ) {
          return NextResponse.json(
            { success: false, error: 'Invalid delivery address' },
            { status: 400 }
          )
        }

        // Calculate totals
        let subtotal = 0
        const processedItems: OrderItem[] = []

        for (const item of items) {
          if (!item.productId || !item.productName || typeof item.price !== 'number' || item.quantity <= 0) {
            return NextResponse.json(
              { success: false, error: 'Invalid item data' },
              { status: 400 }
            )
          }

          const itemTotal = item.price * item.quantity
          subtotal += itemTotal
          processedItems.push({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku || '',
            price: item.price,
            quantity: item.quantity,
            image: item.image || null,
          })
        }

        // Use provided delivery fee or default to 0
        const deliveryFee = typeof customDeliveryFee === 'number' ? customDeliveryFee : 0
        const total = subtotal + deliveryFee

        // Generate order reference
        const orderRef = generateOrderRef()
        const now = new Date()

        // Lookup user UID if not provided
        let customerUid = customer.uid || null;
        if (!customerUid && customer.email) {
          try {
            const userRecord = await adminAuth.getUserByEmail(customer.email);
            customerUid = userRecord.uid;
          } catch (e) {
            // User not found in Firebase Auth, leaving uid as null
          }
        }

        // Create order document
        const orderData = {
          orderRef,
          items: processedItems,
          subtotal,
          deliveryFee,
          total,
          status: 'pending',
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            uid: customerUid,
          },
          deliveryAddress: {
            addressLine1: deliveryAddress.addressLine1,
            addressLine2: deliveryAddress.addressLine2 || '',
            city: deliveryAddress.city,
            district: deliveryAddress.district || '',
            postalCode: deliveryAddress.postalCode,
          },
          notes: notes || null,
          statusHistory: [
            {
              status: 'pending',
              timestamp: now,
              updatedBy: authedReq.user.uid,
              note: 'Order created by admin',
            },
          ],
          createdAt: now,
          updatedAt: now,
        }

        // Save to Firestore
        const docRef = await adminDb.collection('orders').add(orderData)
        
        // Convert dates to ISO strings for JSON response
        const createdOrder = {
          id: docRef.id,
          ...orderData,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          statusHistory: orderData.statusHistory.map((entry) => ({
            ...entry,
            timestamp: entry.timestamp.toISOString(),
          })),
        }

        // Send confirmation email (fire and forget)
        sendOrderConfirmation({
          orderRef,
          customerName: customer.name,
          customerEmail: customer.email,
          total,
          items: processedItems.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            price: i.price * i.quantity,
          })),
        }).catch((err) => console.error('Order confirmation email failed:', err))

        return NextResponse.json(
          {
            success: true,
            data: createdOrder,
            message: `Order ${orderRef} created successfully`,
          },
          { status: 201 }
        )
      }

      // Customer checkout flow (authenticated)
      const { customerInfo, items, deliveryZoneId } = body

      // Validate customer info
      const parsed = checkoutSchema.safeParse(customerInfo)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
      }

      // Calculate totals from Firestore prices (never trust client prices)
      let subtotal = 0
      const orderItems = []

      for (const item of items) {
        const productDoc = await adminDb.collection('products').doc(item.productId).get()
        if (!productDoc.exists) {
          return NextResponse.json({ success: false, error: `Product ${item.productId} not found` }, { status: 400 })
        }

        const product = productDoc.data()!
        if (product.stockQty < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for ${product.name}` },
            { status: 400 }
          )
        }

        subtotal += product.price * item.quantity
        orderItems.push({
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          price: product.price,
          quantity: item.quantity,
          image: product.images?.[0] || null,
        })

        // Decrement stock
        await adminDb.collection('products').doc(item.productId).update({
          stockQty: product.stockQty - item.quantity,
          availabilityStatus:
            product.stockQty - item.quantity === 0
              ? 'out_of_stock'
              : product.stockQty - item.quantity <= 3
                ? 'low_stock'
                : 'in_stock',
          updatedAt: new Date(),
        })
      }

      // Get delivery fee
      let deliveryFee = 350 // default
      if (deliveryZoneId) {
        const settingsDoc = await adminDb.collection('settings').doc('site').get()
        const zones = settingsDoc.data()?.deliveryZones || []
        const zone = zones.find((z: { id: string; fee: number }) => z.id === deliveryZoneId)
        if (zone) deliveryFee = zone.fee
      }

      const orderRef = generateOrderRef()
      const customerData = parsed.data

      const orderData = {
        orderRef,
        items: orderItems,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        status: 'pending',
        customer: {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          uid: authedReq.user.uid, // Explicitly link to authenticated user
        },
        deliveryAddress: {
          addressLine1: customerData.addressLine1,
          addressLine2: customerData.addressLine2 || '',
          city: customerData.city,
          district: customerData.district,
          postalCode: customerData.postalCode,
        },
        notes: customerData.notes || '',
        statusHistory: [
          { status: 'pending', timestamp: new Date(), updatedBy: 'system' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await adminDb.collection('orders').add(orderData)

      // Clear the user's cart
      const cartRef = adminDb.collection('users').doc(authedReq.user.uid).collection('cart')
      const cartItems = await cartRef.get()
      const batch = adminDb.batch()
      cartItems.docs.forEach((doc) => batch.delete(doc.ref))
      await batch.commit()

      // Update or create customer record
      const customerSnapshot = await adminDb
        .collection('customers')
        .where('email', '==', customerData.email)
        .limit(1)
        .get()

      if (customerSnapshot.empty) {
        await adminDb.collection('customers').add({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: orderData.deliveryAddress,
          orderCount: 1,
          totalSpent: orderData.total,
          isRepeat: false,
          firstOrderAt: new Date(),
          lastOrderAt: new Date(),
          createdAt: new Date(),
        })
      } else {
        const existingCustomer = customerSnapshot.docs[0]
        const existing = existingCustomer.data()
        await existingCustomer.ref.update({
          orderCount: (existing.orderCount || 0) + 1,
          totalSpent: (existing.totalSpent || 0) + orderData.total,
          isRepeat: true,
          lastOrderAt: new Date(),
          phone: customerData.phone,
          address: orderData.deliveryAddress,
        })
      }

      // Send emails (fire and forget — don't block the response)
      sendOrderConfirmation({
        orderRef,
        customerName: customerData.name,
        customerEmail: customerData.email,
        total: orderData.total,
        items: orderItems.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          price: i.price * i.quantity,
        })),
      }).catch((err) => console.error('Order confirmation email failed:', err))

      sendNewOrderAlert({
        orderRef,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        total: orderData.total,
        itemCount: orderItems.length,
      }).catch((err) => console.error('New order alert email failed:', err))

      return NextResponse.json(
        { success: true, data: { id: docRef.id, orderRef, total: orderData.total } },
        { status: 201 }
      )
    } catch (error) {
      console.error('POST /api/orders error:', error)
      return NextResponse.json({ success: false, error: 'Failed to place order' }, { status: 500 })
    }
  })
}

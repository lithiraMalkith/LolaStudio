import { Resend } from 'resend'

const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Email sending will be skipped.')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const resend = getResend()

const FROM_EMAIL = process.env.FROM_EMAIL
const OWNER_EMAIL = process.env.OWNER_EMAIL

if (!FROM_EMAIL || !OWNER_EMAIL) {
  console.warn('FROM_EMAIL or OWNER_EMAIL not configured in environment')
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn('Email service not configured. Skipping email send.')
    return { success: false, error: 'Email service not configured' }
  }
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL!,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

// Order confirmation email to customer
export async function sendOrderConfirmation(order: {
  orderRef: string
  customerName: string
  customerEmail: string
  total: number
  items: { productName: string; quantity: number; price: number }[]
}) {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #2A2A2A; color: #F0EDE8;">${item.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #2A2A2A; color: #F0EDE8; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #2A2A2A; color: #C9A84C; text-align: right;">LKR ${item.price.toLocaleString()}</td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="background-color: #0D0D0D; padding: 40px 20px; font-family: 'Inter', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161616; border-radius: 12px; border: 1px solid #2A2A2A; overflow: hidden;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #2A2A2A;">
          <h1 style="color: #C9A84C; font-size: 28px; margin: 0; font-family: 'Playfair Display', serif;">Lola Studio</h1>
          <p style="color: #6B6B6B; margin: 8px 0 0;">Order Confirmation</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #F0EDE8; font-size: 16px;">Dear ${order.customerName},</p>
          <p style="color: #F0EDE8;">Thank you for your order! Your order reference is:</p>
          <div style="background-color: #0D0D0D; border: 1px solid #C9A84C; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="color: #C9A84C; font-size: 20px; font-family: monospace; letter-spacing: 2px;">${order.orderRef}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="border-bottom: 2px solid #C9A84C;">
                <th style="padding: 8px; text-align: left; color: #C9A84C;">Item</th>
                <th style="padding: 8px; text-align: center; color: #C9A84C;">Qty</th>
                <th style="padding: 8px; text-align: right; color: #C9A84C;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #C9A84C;">
            <span style="color: #F0EDE8; font-size: 18px;">Total: </span>
            <span style="color: #C9A84C; font-size: 22px; font-weight: bold;">LKR ${order.total.toLocaleString()}</span>
          </div>
          <p style="color: #6B6B6B; margin-top: 24px; font-size: 14px;">Payment: Cash on Delivery (COD)</p>
          <p style="color: #6B6B6B; font-size: 14px;">We'll notify you once your order is dispatched.</p>
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid #2A2A2A;">
          <p style="color: #6B6B6B; font-size: 12px; margin: 0;">Lola Studio — Handmade Home Décor from Negombo, Sri Lanka</p>
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed — ${order.orderRef} | Lola Studio`,
    html,
  })
}

// New order alert email to owner
export async function sendNewOrderAlert(order: {
  orderRef: string
  customerName: string
  customerPhone: string
  total: number
  itemCount: number
}) {
  const html = `
    <div style="background-color: #0D0D0D; padding: 40px 20px; font-family: 'Inter', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161616; border-radius: 12px; border: 1px solid #2A2A2A; padding: 32px;">
        <h2 style="color: #C9A84C; margin: 0 0 16px;">🛒 New Order Received</h2>
        <p style="color: #F0EDE8;"><strong>Order:</strong> ${order.orderRef}</p>
        <p style="color: #F0EDE8;"><strong>Customer:</strong> ${order.customerName}</p>
        <p style="color: #F0EDE8;"><strong>Phone:</strong> ${order.customerPhone}</p>
        <p style="color: #F0EDE8;"><strong>Items:</strong> ${order.itemCount}</p>
        <p style="color: #C9A84C; font-size: 20px;"><strong>Total: LKR ${order.total.toLocaleString()}</strong></p>
        <p style="color: #6B6B6B; margin-top: 24px;">Login to the admin panel to process this order.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: OWNER_EMAIL!,
    subject: `New Order: ${order.orderRef} — LKR ${order.total.toLocaleString()}`,
    html,
  })
}

// Order Processing Status Email to Customer
export async function sendOrderProcessingEmail(order: {
  orderRef: string
  customerName: string
  customerEmail: string
  estimatedDispatchDate?: string
}) {
  const html = `
    <div style="background-color: #0D0D0D; padding: 40px 20px; font-family: 'Inter', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161616; border-radius: 12px; border: 1px solid #2A2A2A; overflow: hidden;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #2A2A2A;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">⚙️ Order Processing</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #F0EDE8; font-size: 16px;">Dear ${order.customerName},</p>
          <p style="color: #F0EDE8;">Your order is now being processed and prepared for shipment.</p>
          <div style="background-color: #0D0D0D; border: 1px solid #C9A84C; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="color: #C9A84C; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${order.orderRef}</span>
          </div>
          <p style="color: #F0EDE8; margin-top: 20px;">
            ${order.estimatedDispatchDate ? `We estimate your order will be dispatched by <strong style="color: #C9A84C;">${order.estimatedDispatchDate}</strong>.` : 'We will notify you once your order is dispatched.'}
          </p>
          <p style="color: #6B6B6B; margin-top: 24px; font-size: 14px;">Thank you for your patience!</p>
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid #2A2A2A;">
          <p style="color: #6B6B6B; font-size: 12px; margin: 0;">Lola Studio — Handmade Home Décor from Negombo, Sri Lanka</p>
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Processing — ${order.orderRef} | Lola Studio`,
    html,
  })
}

// Order Dispatched Status Email to Customer
export async function sendOrderDispatchedEmail(order: {
  orderRef: string
  customerName: string
  customerEmail: string
  trackingNumber?: string
  estimatedDeliveryDate?: string
  deliveryAddress?: string
}) {
  const html = `
    <div style="background-color: #0D0D0D; padding: 40px 20px; font-family: 'Inter', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161616; border-radius: 12px; border: 1px solid #2A2A2A; overflow: hidden;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #2A2A2A;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">🚚 Order Dispatched</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #F0EDE8; font-size: 16px;">Dear ${order.customerName},</p>
          <p style="color: #F0EDE8;">Great news! Your order has been dispatched and is on its way to you.</p>
          <div style="background-color: #0D0D0D; border: 1px solid #C9A84C; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #6B6B6B; margin: 0; font-size: 12px;">Order Reference</p>
            <p style="color: #C9A84C; font-size: 18px; font-family: monospace; letter-spacing: 2px; margin: 8px 0;">${order.orderRef}</p>
            ${order.trackingNumber ? `<p style="color: #6B6B6B; margin: 12px 0 0; font-size: 12px;">Tracking Number</p><p style="color: #F0EDE8; font-size: 16px; margin: 8px 0;">${order.trackingNumber}</p>` : ''}
          </div>
          ${order.estimatedDeliveryDate ? `<p style="color: #F0EDE8;">📅 Estimated Delivery: <strong style="color: #C9A84C;">${order.estimatedDeliveryDate}</strong></p>` : ''}
          ${order.deliveryAddress ? `<p style="color: #F0EDE8;">📍 Delivering to: <span style="color: #C9A84C;">${order.deliveryAddress}</span></p>` : ''}
          <p style="color: #6B6B6B; margin-top: 24px; font-size: 14px;">If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid #2A2A2A;">
          <p style="color: #6B6B6B; font-size: 12px; margin: 0;">Lola Studio — Handmade Home Décor from Negombo, Sri Lanka</p>
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Dispatched — ${order.orderRef} | Lola Studio`,
    html,
  })
}

// Order Delivered Status Email to Customer
export async function sendOrderDeliveredEmail(order: {
  orderRef: string
  customerName: string
  customerEmail: string
  deliveryDate: string
}) {
  const html = `
    <div style="background-color: #0D0D0D; padding: 40px 20px; font-family: 'Inter', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161616; border-radius: 12px; border: 1px solid #2A2A2A; overflow: hidden;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #2A2A2A;">
          <h1 style="color: #C9A84C; font-size: 24px; margin: 0;">✅ Order Delivered</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #F0EDE8; font-size: 16px;">Dear ${order.customerName},</p>
          <p style="color: #F0EDE8;">Your order has been successfully delivered on ${order.deliveryDate}!</p>
          <div style="background-color: #0D0D0D; border: 2px solid #C9A84C; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="color: #C9A84C; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${order.orderRef}</span>
          </div>
          <p style="color: #F0EDE8; margin-top: 20px;">We hope you love your handmade home décor items from Lola Studio!</p>
          <p style="color: #6B6B6B; margin-top: 24px; font-size: 14px;">If you have any feedback or concerns, we'd love to hear from you. Please reply to this email or contact our support team.</p>
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid #2A2A2A;">
          <p style="color: #6B6B6B; font-size: 12px; margin: 0;">Lola Studio — Handmade Home Décor from Negombo, Sri Lanka</p>
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Delivered — ${order.orderRef} | Lola Studio`,
    html,
  })
}

// Order Cancelled Status Email to Customer
export async function sendOrderCancelledEmail(order: {
  orderRef: string
  customerName: string
  customerEmail: string
  cancellationReason?: string
  refundAmount?: number
}) {
  const html = `
    <div style="background-color: #0D0D0D; padding: 40px 20px; font-family: 'Inter', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #161616; border-radius: 12px; border: 1px solid #2A2A2A; overflow: hidden;">
        <div style="padding: 32px; text-align: center; border-bottom: 1px solid #2A2A2A;">
          <h1 style="color: #DC2626; font-size: 24px; margin: 0;">❌ Order Cancelled</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #F0EDE8; font-size: 16px;">Dear ${order.customerName},</p>
          <p style="color: #F0EDE8;">Your order has been cancelled.</p>
          <div style="background-color: #0D0D0D; border: 1px solid #DC2626; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="color: #DC2626; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${order.orderRef}</span>
          </div>
          ${order.cancellationReason ? `<p style="color: #F0EDE8;"><strong>Reason:</strong> ${order.cancellationReason}</p>` : ''}
          ${order.refundAmount ? `<p style="color: #F0EDE8; margin-top: 16px;"><strong>Refund Amount:</strong> <span style="color: #C9A84C;">LKR ${order.refundAmount.toLocaleString()}</span></p>` : ''}
          <p style="color: #6B6B6B; margin-top: 24px; font-size: 14px;">If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div style="padding: 24px; text-align: center; border-top: 1px solid #2A2A2A;">
          <p style="color: #6B6B6B; font-size: 12px; margin: 0;">Lola Studio — Handmade Home Décor from Negombo, Sri Lanka</p>
        </div>
      </div>
    </div>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Cancelled — ${order.orderRef} | Lola Studio`,
    html,
  })
}

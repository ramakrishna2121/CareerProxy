import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { stripe } from '@/lib/stripe/client'

const schema = z.object({
  stripe_subscription_id: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'admin')
  if (roleError) return roleError

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { stripe_subscription_id } = parsed.data

  // Fetch the subscription to get the customer
  const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id)
  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  // Find the most recent paid invoice for this subscription
  const invoices = await stripe.invoices.list({
    customer: customerId,
    subscription: stripe_subscription_id,
    limit: 1,
  })

  const latestInvoice = invoices.data[0]
  if (!latestInvoice) {
    return NextResponse.json({ error: 'No invoices found for this subscription' }, { status: 404 })
  }

  // Extract PaymentIntent ID from confirmation_secret.client_secret
  // Format: "pi_xxx_secret_yyy" → PaymentIntent ID is "pi_xxx"
  const clientSecret = latestInvoice.confirmation_secret?.client_secret
  if (!clientSecret) {
    return NextResponse.json({ error: 'No payment found for this invoice' }, { status: 400 })
  }
  const paymentIntentId = clientSecret.split('_secret_')[0]

  // Issue a full refund
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
  })

  return NextResponse.json({ success: true, refund_id: refund.id, amount: refund.amount })
}

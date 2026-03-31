import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe, getPriceId } from '@/lib/stripe/client'

const schema = z.object({
  stripe_subscription_id: z.string().min(1),
  new_plan: z.enum(['starter', 'pro', 'premium']),
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

  const { stripe_subscription_id, new_plan } = parsed.data

  // Fetch the current subscription from Stripe to get the item ID
  const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id)
  if (!subscription || subscription.status === 'canceled') {
    return NextResponse.json({ error: 'Subscription not found or already canceled' }, { status: 404 })
  }

  const itemId = subscription.items.data[0]?.id
  if (!itemId) {
    return NextResponse.json({ error: 'No subscription item found' }, { status: 400 })
  }

  const newPriceId = getPriceId(new_plan)

  // Update the Stripe subscription
  await stripe.subscriptions.update(stripe_subscription_id, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: 'create_prorations',
  })

  // Update the local subscriptions table
  const supabase = createAdminClient()
  await supabase
    .from('subscriptions')
    .update({ plan: new_plan, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', stripe_subscription_id)

  return NextResponse.json({ success: true, new_plan })
}

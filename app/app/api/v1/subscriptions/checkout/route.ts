import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe, getPriceId } from '@/lib/stripe/client'
import { SubscriptionPlan } from '@/types'

const VALID_PLANS: SubscriptionPlan[] = ['starter', 'pro', 'premium']

// POST /api/v1/subscriptions/checkout
export async function POST(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'candidate')
  if (roleError) return roleError

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { plan } = body as { plan: SubscriptionPlan }

  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json(
      { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Look up existing subscription to reuse stripe customer
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('candidate_id', auth.userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const stripeCustomerId: string | null = existingSubscription?.stripe_customer_id ?? null

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { candidate_id: auth.userId },
    ...(stripeCustomerId
      ? { customer: stripeCustomerId }
      : { customer_email: auth.email }),
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return NextResponse.json({ checkout_url: session.url })
}

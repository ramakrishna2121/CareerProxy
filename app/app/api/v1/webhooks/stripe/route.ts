import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, getPriceId } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import { SubscriptionPlan, SubscriptionStatus } from '@/types'

// Public route — NO JWT auth. Stripe signature verification is used instead.

function mapStripePlanFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === getPriceId('starter')) return 'starter'
  if (priceId === getPriceId('pro')) return 'pro'
  if (priceId === getPriceId('premium')) return 'premium'
  // Default fallback — unknown price treated as starter
  return 'starter'
}

function mapStripeStatus(status: Stripe.Subscription['status']): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'canceled':
      return 'canceled'
    case 'past_due':
      return 'past_due'
    case 'trialing':
      return 'trialing'
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
    default:
      return 'incomplete'
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Only handle subscription lifecycle events
  const handledTypes = [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ]

  if (!handledTypes.includes(event.type)) {
    return NextResponse.json({ received: true })
  }

  const subscription = event.data.object as Stripe.Subscription

  // Resolve the candidate_id:
  // 1. From subscription metadata (set at checkout)
  // 2. From checkout session metadata (fallback via Stripe API)
  let candidateId: string | null = subscription.metadata?.candidate_id ?? null

  if (!candidateId) {
    // Try to find by stripe_subscription_id in our DB
    const { data: existingRow } = await supabase
      .from('subscriptions')
      .select('candidate_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()
    candidateId = existingRow?.candidate_id ?? null
  }

  if (!candidateId) {
    // Can't process without a candidate — acknowledge receipt to avoid retries
    return NextResponse.json({ received: true, warning: 'candidate_id not resolved' })
  }

  // Idempotency: check if this event ID has already been processed
  const { data: existingSubscriptionRow } = await supabase
    .from('subscriptions')
    .select('id, stripe_event_ids')
    .eq('candidate_id', candidateId)
    .single()

  if (existingSubscriptionRow?.stripe_event_ids?.includes(event.id)) {
    // Already processed — return 200 immediately
    return NextResponse.json({ received: true, duplicate: true })
  }

  const firstItem = subscription.items.data[0]
  const priceId = firstItem?.price?.id ?? ''
  const plan = mapStripePlanFromPriceId(priceId)
  const status = mapStripeStatus(subscription.status)
  // In Stripe API 2026-03-25 (v21), current_period_end lives on the SubscriptionItem
  const periodEnd: number | null | undefined = (firstItem as unknown as { current_period_end?: number })?.current_period_end
  const currentPeriodEnd = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : new Date(subscription.billing_cycle_anchor * 1000).toISOString()
  const cancelAt = subscription.cancel_at
    ? new Date(subscription.cancel_at * 1000).toISOString()
    : null

  // Build updated event IDs list (append)
  const previousEventIds: string[] = existingSubscriptionRow?.stripe_event_ids ?? []
  const updatedEventIds = [...previousEventIds, event.id]

  if (event.type === 'customer.subscription.deleted') {
    // Set status to canceled; keep other fields
    if (existingSubscriptionRow) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          stripe_event_ids: updatedEventIds,
          updated_at: new Date().toISOString(),
        })
        .eq('candidate_id', candidateId)
    }

    // Update profiles.plan to starter (no active plan)
    await supabase
      .from('profiles')
      .update({ plan: 'starter', updated_at: new Date().toISOString() })
      .eq('id', candidateId)

    return NextResponse.json({ received: true })
  }

  // created or updated — upsert the subscriptions row
  const upsertPayload = {
    candidate_id: candidateId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id ?? '',
    plan,
    status,
    current_period_end: currentPeriodEnd,
    cancel_at: cancelAt,
    stripe_event_ids: updatedEventIds,
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from('subscriptions')
    .upsert(upsertPayload, { onConflict: 'candidate_id' })

  if (upsertError) {
    console.error('Stripe webhook: failed to upsert subscription', upsertError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Sync plan to profiles table
  await supabase
    .from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', candidateId)

  return NextResponse.json({ received: true })
}

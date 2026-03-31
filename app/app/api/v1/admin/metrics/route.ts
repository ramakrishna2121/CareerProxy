import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { PLAN_PRICES_USD, type Metrics } from '@/types'

export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'admin')
  if (roleError) return roleError

  const supabase = createAdminClient()

  // total_candidates: count profiles WHERE role = 'candidate'
  const { count: totalCandidates } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'candidate')

  // active_subscriptions: count subscriptions WHERE status = 'active'
  const { count: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // MRR: sum PLAN_PRICES_USD for active subscriptions grouped by plan
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('status', 'active')

  const mrr = (activeSubs ?? []).reduce((sum: number, sub: { plan: keyof typeof PLAN_PRICES_USD }) => {
    return sum + (PLAN_PRICES_USD[sub.plan] ?? 0)
  }, 0)

  // total_applications: count applications WHERE deleted_at IS NULL
  const { count: totalApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  // avg_apps_per_candidate: total_applications / total_candidates (0 if no candidates)
  const tc = totalCandidates ?? 0
  const ta = totalApplications ?? 0
  const avgAppsPerCandidate = tc > 0 ? ta / tc : 0

  const metrics: Metrics = {
    total_candidates: tc,
    active_subscriptions: activeSubscriptions ?? 0,
    mrr,
    total_applications: ta,
    avg_apps_per_candidate: Math.round(avgAppsPerCandidate * 100) / 100,
  }

  return NextResponse.json(metrics)
}

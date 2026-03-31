import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/candidates/me/dashboard
export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const supabase = createAdminClient()

  // Start of current month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // total_apps_this_month
  const { count: totalApps } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', auth.userId)
    .gte('applied_at', startOfMonth)
    .is('deleted_at', null)

  // interviews_scheduled this month
  const { count: interviewsScheduled } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', auth.userId)
    .eq('status', 'interview_scheduled')
    .gte('applied_at', startOfMonth)
    .is('deleted_at', null)

  // Active subscription plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('candidate_id', auth.userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    total_apps_this_month: totalApps ?? 0,
    interviews_scheduled: interviewsScheduled ?? 0,
    plan: subscription?.plan ?? null,
    plan_status: subscription?.status ?? null,
  })
}

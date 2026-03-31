import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

const querySchema = z.object({
  plan: z.enum(['starter', 'pro', 'premium']).optional(),
  status: z.enum(['active', 'paused', 'inactive']).optional(),
  team_member_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'admin')
  if (roleError) return roleError

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    plan: searchParams.get('plan') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    team_member_id: searchParams.get('team_member_id') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 25,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
  }

  const { plan, status, team_member_id, page, limit } = parsed.data
  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  // Build base query for candidates
  let query = supabase
    .from('profiles')
    .select(
      `
      id,
      email,
      full_name,
      role,
      status,
      created_at,
      subscriptions (
        plan,
        status,
        current_period_end,
        stripe_subscription_id
      ),
      team_assignments (
        team_member_id,
        profiles:team_member_id (
          full_name,
          email
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('role', 'candidate')

  if (status) {
    query = query.eq('status', status)
  }

  if (team_member_id) {
    // Filter candidates assigned to a specific team member via a subquery approach
    const { data: assignedIds } = await supabase
      .from('team_assignments')
      .select('candidate_id')
      .eq('team_member_id', team_member_id)

    const ids = (assignedIds ?? []).map((r: { candidate_id: string }) => r.candidate_id)
    if (ids.length === 0) {
      return NextResponse.json({ data: [], total: 0 })
    }
    query = query.in('id', ids)
  }

  // Plan filter requires joining through subscriptions
  if (plan) {
    const { data: subIds } = await supabase
      .from('subscriptions')
      .select('candidate_id')
      .eq('plan', plan)
      .eq('status', 'active')

    const ids = (subIds ?? []).map((r: { candidate_id: string }) => r.candidate_id)
    if (ids.length === 0) {
      return NextResponse.json({ data: [], total: 0 })
    }
    query = query.in('id', ids)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}

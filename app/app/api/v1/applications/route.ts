import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { ApplicationStatus, JobBoard, PLAN_DAILY_LIMITS, SubscriptionPlan } from '@/types'

const VALID_STATUSES: ApplicationStatus[] = [
  'applied',
  'viewed',
  'interview_scheduled',
  'rejected',
  'offer',
  'withdrawn',
]

const VALID_JOB_BOARDS: JobBoard[] = ['LinkedIn', 'Indeed', 'Glassdoor']

// GET /api/v1/applications
export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const supabase = createAdminClient()
  const { searchParams } = req.nextUrl

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)))
  const offset = (page - 1) * limit
  const statusFilter = searchParams.get('status') as ApplicationStatus | null
  const candidateIdFilter = searchParams.get('candidate_id')

  let query = supabase
    .from('applications')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('applied_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (auth.role === 'candidate') {
    query = query.eq('candidate_id', auth.userId)
  } else if (auth.role === 'team_member') {
    // Get assigned candidate IDs
    const { data: assignments } = await supabase
      .from('team_assignments')
      .select('candidate_id')
      .eq('team_member_id', auth.userId)

    const assignedIds = (assignments ?? []).map((a: { candidate_id: string }) => a.candidate_id)

    if (assignedIds.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, limit })
    }

    if (candidateIdFilter) {
      if (!assignedIds.includes(candidateIdFilter)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      query = query.eq('candidate_id', candidateIdFilter)
    } else {
      query = query.in('candidate_id', assignedIds)
    }
  } else if (auth.role === 'admin') {
    if (candidateIdFilter) {
      query = query.eq('candidate_id', candidateIdFilter)
    }
  }

  if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit })
}

// POST /api/v1/applications
export async function POST(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'team_member', 'admin')
  if (roleError) return roleError

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { candidate_id, company, job_title, job_board, job_url, applied_at, notes } = body

  // Validate required fields
  if (!candidate_id || !company || !job_title || !job_board || !job_url) {
    return NextResponse.json(
      { error: 'Missing required fields: candidate_id, company, job_title, job_board, job_url' },
      { status: 400 }
    )
  }

  if (!VALID_JOB_BOARDS.includes(job_board as JobBoard)) {
    return NextResponse.json(
      { error: `Invalid job_board. Must be one of: ${VALID_JOB_BOARDS.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Verify assignment (team_member must be assigned to this candidate; admin can skip)
  if (auth.role === 'team_member') {
    const { data: assignment } = await supabase
      .from('team_assignments')
      .select('candidate_id')
      .eq('team_member_id', auth.userId)
      .eq('candidate_id', candidate_id)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this candidate' },
        { status: 403 }
      )
    }
  }

  // Fetch candidate plan from subscriptions
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('candidate_id', candidate_id)
    .eq('status', 'active')
    .single()

  const plan = (subscription?.plan ?? 'starter') as SubscriptionPlan
  const dailyLimit = PLAN_DAILY_LIMITS[plan]

  // Check plan daily limit
  if (dailyLimit !== null) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidate_id)
      .gte('applied_at', today.toISOString())
      .is('deleted_at', null)

    if ((count ?? 0) >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily application limit of ${dailyLimit} reached for this candidate's plan` },
        { status: 429 }
      )
    }
  }

  // Insert application
  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      candidate_id,
      team_member_id: auth.userId,
      company,
      job_title,
      job_board,
      job_url,
      status: 'applied' as ApplicationStatus,
      applied_at: applied_at ?? new Date().toISOString(),
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }

  return NextResponse.json(application, { status: 201 })
}

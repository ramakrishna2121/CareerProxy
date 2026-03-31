import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { ApplicationStatus, JobBoard, PLAN_DAILY_LIMITS, SubscriptionPlan } from '@/types'

const VALID_JOB_BOARDS: JobBoard[] = ['LinkedIn', 'Indeed', 'Glassdoor']

interface BulkRow {
  candidate_id?: string
  company?: string
  job_title?: string
  job_board?: string
  job_url?: string
  applied_at?: string
  notes?: string
}

// POST /api/v1/applications/bulk
export async function POST(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'team_member', 'admin')
  if (roleError) return roleError

  const body = await req.json().catch(() => null)

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Request body must be a JSON array of application objects' },
      { status: 400 }
    )
  }

  if (body.length === 0) {
    return NextResponse.json({ imported: 0, failed: 0, errors: [] })
  }

  const supabase = createAdminClient()

  // Pre-fetch team assignments for this team member (if not admin)
  let assignedCandidateIds: string[] | null = null
  if (auth.role === 'team_member') {
    const { data: assignments } = await supabase
      .from('team_assignments')
      .select('candidate_id')
      .eq('team_member_id', auth.userId)

    assignedCandidateIds = (assignments ?? []).map(
      (a: { candidate_id: string }) => a.candidate_id
    )
  }

  // Cache plan info per candidate to avoid repeated queries
  const planCache = new Map<string, SubscriptionPlan>()
  const todayCountCache = new Map<string, number>()

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const toInsert: object[] = []
  const errors: { row: number; error: string }[] = []

  for (let i = 0; i < body.length; i++) {
    const row = body[i] as BulkRow
    const rowNum = i + 1

    const { candidate_id, company, job_title, job_board, job_url, applied_at, notes } = row

    // Validate required fields
    if (!candidate_id) {
      errors.push({ row: rowNum, error: 'Missing required field: candidate_id' })
      continue
    }
    if (!company) {
      errors.push({ row: rowNum, error: 'Missing required field: company' })
      continue
    }
    if (!job_title) {
      errors.push({ row: rowNum, error: 'Missing required field: job_title' })
      continue
    }
    if (!job_board) {
      errors.push({ row: rowNum, error: 'Missing required field: job_board' })
      continue
    }
    if (!job_url) {
      errors.push({ row: rowNum, error: 'Missing required field: job_url' })
      continue
    }
    if (!VALID_JOB_BOARDS.includes(job_board as JobBoard)) {
      errors.push({
        row: rowNum,
        error: `Invalid job_board "${job_board}". Must be one of: ${VALID_JOB_BOARDS.join(', ')}`,
      })
      continue
    }

    // Verify assignment
    if (auth.role === 'team_member' && assignedCandidateIds !== null) {
      if (!assignedCandidateIds.includes(candidate_id)) {
        errors.push({ row: rowNum, error: `Not assigned to candidate ${candidate_id}` })
        continue
      }
    }

    // Fetch plan (cached)
    if (!planCache.has(candidate_id)) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('candidate_id', candidate_id)
        .eq('status', 'active')
        .single()
      planCache.set(candidate_id, (subscription?.plan ?? 'starter') as SubscriptionPlan)
    }

    const plan = planCache.get(candidate_id)!
    const dailyLimit = PLAN_DAILY_LIMITS[plan]

    if (dailyLimit !== null) {
      // Fetch today's count (cached; we'll increment as we queue rows)
      if (!todayCountCache.has(candidate_id)) {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('candidate_id', candidate_id)
          .gte('applied_at', today.toISOString())
          .is('deleted_at', null)
        todayCountCache.set(candidate_id, count ?? 0)
      }

      const currentCount = todayCountCache.get(candidate_id)!
      if (currentCount >= dailyLimit) {
        errors.push({
          row: rowNum,
          error: `Daily limit of ${dailyLimit} reached for candidate ${candidate_id}`,
        })
        continue
      }

      // Increment local counter for subsequent rows in this batch
      todayCountCache.set(candidate_id, currentCount + 1)
    }

    toInsert.push({
      candidate_id,
      team_member_id: auth.userId,
      company,
      job_title,
      job_board: job_board as JobBoard,
      job_url,
      status: 'applied' as ApplicationStatus,
      applied_at: applied_at ?? new Date().toISOString(),
      notes: notes ?? null,
    })
  }

  let imported = 0

  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('applications')
      .insert(toInsert)
      .select()

    if (insertError) {
      return NextResponse.json(
        { error: 'Bulk insert failed', details: insertError.message },
        { status: 500 }
      )
    }

    imported = inserted?.length ?? toInsert.length
  }

  return NextResponse.json({
    imported,
    failed: errors.length,
    errors,
  })
}

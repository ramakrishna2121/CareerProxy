import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { ApplicationStatus } from '@/types'

const VALID_STATUSES: ApplicationStatus[] = [
  'applied',
  'viewed',
  'interview_scheduled',
  'rejected',
  'offer',
  'withdrawn',
]

type RouteParams = { params: Promise<{ id: string }> }

async function getApplicationScoped(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
  auth: { userId: string; role: string }
) {
  const { data: application, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !application) return null

  if (auth.role === 'candidate') {
    if (application.candidate_id !== auth.userId) return null
  } else if (auth.role === 'team_member') {
    const { data: assignment } = await supabase
      .from('team_assignments')
      .select('candidate_id')
      .eq('team_member_id', auth.userId)
      .eq('candidate_id', application.candidate_id)
      .single()
    if (!assignment) return null
  }
  // admin: no extra filter

  return application
}

// GET /api/v1/applications/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const application = await getApplicationScoped(supabase, id, auth)
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  return NextResponse.json(application)
}

// PATCH /api/v1/applications/[id]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'team_member', 'admin')
  if (roleError) return roleError

  const { id } = await params
  const supabase = createAdminClient()

  const application = await getApplicationScoped(supabase, id, auth)
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Partial<{ status: ApplicationStatus; notes: string }> = {}

  if ('status' in body) {
    if (!VALID_STATUSES.includes(body.status as ApplicationStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }
    updates.status = body.status as ApplicationStatus
  }

  if ('notes' in body) {
    updates.notes = body.notes
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update (status, notes)' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }

  return NextResponse.json(updated)
}

// DELETE /api/v1/applications/[id] — soft delete
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'team_member', 'admin')
  if (roleError) return roleError

  const { id } = await params
  const supabase = createAdminClient()

  const application = await getApplicationScoped(supabase, id, auth)
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('applications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

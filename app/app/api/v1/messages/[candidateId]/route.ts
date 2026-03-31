import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ candidateId: string }> }

async function checkPlanGate(candidateId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('candidate_id', candidateId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Must be pro or premium to use messaging
  return subscription?.plan === 'pro' || subscription?.plan === 'premium'
}

async function checkTeamAssignment(teamMemberId: string, candidateId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('team_assignments')
    .select('candidate_id')
    .eq('team_member_id', teamMemberId)
    .eq('candidate_id', candidateId)
    .single()
  return !!data
}

// GET /api/v1/messages/{candidateId}
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const { candidateId } = await context.params

  // Role-based access check
  if (auth.role === 'candidate') {
    if (auth.userId !== candidateId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (auth.role === 'team_member') {
    const assigned = await checkTeamAssignment(auth.userId, candidateId)
    if (!assigned) {
      return NextResponse.json({ error: 'Forbidden: not assigned to this candidate' }, { status: 403 })
    }
  }
  // admins pass through

  // Plan gate — check the candidate's plan
  const allowed = await checkPlanGate(candidateId)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Messaging requires a Pro or Premium plan' },
      { status: 403 }
    )
  }

  const supabase = createAdminClient()

  // Fetch all messages for this thread ordered ASC
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', candidateId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  // Mark unread messages from the other party as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', candidateId)
    .neq('sender_id', auth.userId)
    .is('read_at', null)

  return NextResponse.json(messages ?? [])
}

// POST /api/v1/messages/{candidateId}
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const { candidateId } = await context.params

  // Role-based access check
  if (auth.role === 'candidate') {
    if (auth.userId !== candidateId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (auth.role === 'team_member') {
    const assigned = await checkTeamAssignment(auth.userId, candidateId)
    if (!assigned) {
      return NextResponse.json({ error: 'Forbidden: not assigned to this candidate' }, { status: 403 })
    }
  }
  // admins pass through

  // Plan gate
  const allowed = await checkPlanGate(candidateId)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Messaging requires a Pro or Premium plan' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { content } = body as { content: string }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Message content must not be empty' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      thread_id: candidateId,
      sender_id: auth.userId,
      sender_role: auth.role === 'team_member' ? 'team_member' : 'candidate',
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json(message, { status: 201 })
}

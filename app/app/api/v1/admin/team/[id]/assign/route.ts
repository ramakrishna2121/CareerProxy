import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

const assignSchema = z.object({
  candidate_ids: z.array(z.string().uuid()).min(0),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'admin')
  if (roleError) return roleError

  const { id: teamMemberId } = await params

  const body = await req.json().catch(() => null)
  const parsed = assignSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { candidate_ids } = parsed.data

  const supabase = createAdminClient()

  // Verify team member exists
  const { data: teamMember, error: memberError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', teamMemberId)
    .eq('role', 'team_member')
    .single()

  if (memberError || !teamMember) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
  }

  if (candidate_ids.length > 0) {
    // Delete existing team_assignments for the listed candidates (not all of team member's assignments)
    const { error: deleteError } = await supabase
      .from('team_assignments')
      .delete()
      .in('candidate_id', candidate_ids)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to remove existing assignments' }, { status: 500 })
    }

    // Insert new assignments
    const newAssignments = candidate_ids.map((candidateId) => ({
      team_member_id: teamMemberId,
      candidate_id: candidateId,
    }))

    const { error: insertError } = await supabase
      .from('team_assignments')
      .insert(newAssignments)

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create assignments' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}

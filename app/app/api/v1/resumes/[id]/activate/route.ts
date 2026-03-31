import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

// PATCH /api/v1/resumes/{id}/activate
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const { id } = await params
  const supabase = createAdminClient()

  // Verify the resume exists and belongs to the candidate
  const { data: resume, error: fetchError } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', id)
    .eq('candidate_id', auth.userId)
    .single()

  if (fetchError || !resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  // Deactivate all other resumes for this candidate
  const { error: deactivateError } = await supabase
    .from('resumes')
    .update({ is_active: false })
    .eq('candidate_id', auth.userId)
    .neq('id', id)

  if (deactivateError) {
    return NextResponse.json(
      { error: 'Failed to deactivate other resumes', details: deactivateError.message },
      { status: 500 }
    )
  }

  // Activate the target resume
  const { data: activated, error: activateError } = await supabase
    .from('resumes')
    .update({ is_active: true })
    .eq('id', id)
    .eq('candidate_id', auth.userId)
    .select()
    .single()

  if (activateError) {
    return NextResponse.json(
      { error: 'Failed to activate resume', details: activateError.message },
      { status: 500 }
    )
  }

  return NextResponse.json(activated)
}

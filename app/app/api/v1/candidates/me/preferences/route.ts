import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

const preferencesSchema = z.object({
  target_titles: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  salary_min: z.number().int().nonnegative().optional().nullable(),
  salary_max: z.number().int().nonnegative().optional().nullable(),
  work_type: z.enum(['remote', 'hybrid', 'onsite']).optional().nullable(),
  visa_sponsorship: z.boolean().default(false),
})

// GET /api/v1/candidates/me/preferences
export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('job_preferences')
    .select('*')
    .eq('candidate_id', auth.userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to fetch preferences', details: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(null, { status: 200 })
  }

  return NextResponse.json(data)
}

// PUT /api/v1/candidates/me/preferences
export async function PUT(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const body = await req.json().catch(() => null)
  const parsed = preferencesSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('job_preferences')
    .upsert(
      {
        candidate_id: auth.userId,
        ...parsed.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'candidate_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save preferences', details: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

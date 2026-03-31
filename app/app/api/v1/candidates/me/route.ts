import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  onboarding_complete: z.boolean().optional(),
})

// GET /api/v1/candidates/me
export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PATCH /api/v1/candidates/me
export async function PATCH(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { email, ...profileFields } = parsed.data
  const supabase = createAdminClient()

  // If email is changing, sync to Supabase Auth
  if (email && email !== auth.email) {
    const { error: authError } = await supabase.auth.admin.updateUserById(
      auth.userId,
      { email }
    )
    if (authError) {
      return NextResponse.json(
        { error: 'Failed to update email in auth', details: authError.message },
        { status: 500 }
      )
    }
  }

  const updatePayload: Record<string, unknown> = {
    ...profileFields,
    updated_at: new Date().toISOString(),
  }
  if (email) updatePayload.email = email

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', auth.userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

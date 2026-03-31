import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'

// GET /api/v1/admin/team
export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'admin')
  if (roleError) return roleError

  const supabase = createAdminClient()

  const { data: teamMembers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, status, created_at')
    .eq('role', 'team_member')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }

  // For each team member, count their assigned candidates
  const withCounts = await Promise.all(
    (teamMembers ?? []).map(async (member: { id: string; email: string; full_name: string; status: string; created_at: string }) => {
      const { count } = await supabase
        .from('team_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('team_member_id', member.id)

      return { ...member, candidate_count: count ?? 0 }
    })
  )

  return NextResponse.json(withCounts)
}

const createTeamMemberSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(255),
})

// POST /api/v1/admin/team
export async function POST(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'admin')
  if (roleError) return roleError

  const body = await req.json().catch(() => null)
  const parsed = createTeamMemberSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }

  const { email, full_name } = parsed.data
  const supabase = createAdminClient()

  // Create the Auth user with admin API
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name, role: 'team_member' },
  })

  if (createError || !userData.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create user' },
      { status: 400 }
    )
  }

  const userId = userData.user.id

  // Update the auto-created profile to set role = 'team_member'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'team_member', full_name })
    .eq('id', userId)
    .select()
    .single()

  if (profileError) {
    // Attempt to clean up the auth user if profile update fails
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to update team member profile' }, { status: 500 })
  }

  // Send welcome email via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@careerproxy.com',
      to: [email],
      subject: 'Welcome to CareerProxy',
      react: WelcomeEmail({ name: full_name }),
    })
  } catch (emailError) {
    // Log but don't fail the request if email sending fails
    console.error('Failed to send welcome email:', emailError)
  }

  return NextResponse.json(profile, { status: 201 })
}

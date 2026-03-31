import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/subscriptions/me
export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const roleError = requireRole(auth, 'candidate')
  if (roleError) return roleError

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('candidate_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

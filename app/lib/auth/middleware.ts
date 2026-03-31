import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { UserRole } from '@/types'

export interface AuthContext {
  userId: string
  role: UserRole
  email: string
}

/**
 * Validates the Bearer JWT from the Authorization header.
 * Returns AuthContext on success, or a NextResponse error on failure.
 */
export async function withAuth(
  req: NextRequest
): Promise<AuthContext | NextResponse> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch role from profiles table
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return {
    userId: user.id,
    role: profile.role as UserRole,
    email: user.email!,
  }
}

/**
 * Checks that the authenticated user has one of the required roles.
 * Returns a 403 response if the role check fails.
 */
export function requireRole(
  auth: AuthContext,
  ...roles: UserRole[]
): NextResponse | null {
  if (!roles.includes(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

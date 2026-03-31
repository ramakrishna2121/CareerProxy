import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    )
  }

  const { email, password, full_name } = parsed.data
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) {
    if (error.message.includes('already registered') || error.code === 'email_exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Sign in to get tokens
  const { createClient: createSupabase } = require('@supabase/supabase-js')
  const anonClient = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return NextResponse.json({ id: data.user.id }, { status: 201 })
  }

  return NextResponse.json(
    {
      id: data.user.id,
      access_token: session.session?.access_token,
      refresh_token: session.session?.refresh_token,
    },
    { status: 201 }
  )
}

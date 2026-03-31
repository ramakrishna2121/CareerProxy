import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/v1/resumes/{id}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const { id } = await params
  const supabase = createAdminClient()

  // Fetch the resume to verify ownership and get the storage path
  const { data: resume, error: fetchError } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('candidate_id', auth.userId)
    .single()

  if (fetchError || !resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  // Remove file from storage
  const storagePath = resume.file_url
  const { error: storageError } = await supabase.storage
    .from('resumes')
    .remove([storagePath])

  if (storageError) {
    return NextResponse.json(
      { error: 'Failed to delete file from storage', details: storageError.message },
      { status: 500 }
    )
  }

  // Delete the database row
  const { error: dbError } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)
    .eq('candidate_id', auth.userId)

  if (dbError) {
    return NextResponse.json(
      { error: 'Failed to delete resume record', details: dbError.message },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole } from '@/lib/auth/middleware'
import { createAdminClient } from '@/lib/supabase/server'
import type { Resume } from '@/types'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// GET /api/v1/resumes
export async function GET(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  const supabase = createAdminClient()
  const { data: resumes, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('candidate_id', auth.userId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch resumes', details: error.message }, { status: 500 })
  }

  // Generate signed URLs for each resume
  const resumesWithUrls = await Promise.all(
    (resumes ?? []).map(async (resume: Resume) => {
      // Extract storage path from file_url or reconstruct it
      const storagePath = `${auth.userId}/${resume.file_name}`
      const { data: signedUrlData } = await supabase.storage
        .from('resumes')
        .createSignedUrl(storagePath, 3600)

      return {
        ...resume,
        signed_url: signedUrlData?.signedUrl ?? null,
      }
    })
  )

  return NextResponse.json(resumesWithUrls)
}

// POST /api/v1/resumes
export async function POST(req: NextRequest) {
  const auth = await withAuth(req)
  if (auth instanceof NextResponse) return auth

  const forbid = requireRole(auth, 'candidate')
  if (forbid) return forbid

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only PDF and DOCX files are allowed.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 10MB.' },
      { status: 400 }
    )
  }

  const fileType = file.type === 'application/pdf' ? 'pdf' : 'docx'
  const timestamp = Date.now()
  const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `${auth.userId}/${safeFileName}`

  const supabase = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: 'Failed to upload file', details: uploadError.message },
      { status: 500 }
    )
  }

  const { data: signedUrlData } = await supabase.storage
    .from('resumes')
    .createSignedUrl(storagePath, 3600)

  const { data: resume, error: dbError } = await supabase
    .from('resumes')
    .insert({
      candidate_id: auth.userId,
      file_url: storagePath,
      file_name: safeFileName,
      file_type: fileType,
      is_active: false,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (dbError) {
    // Attempt to clean up the uploaded file
    await supabase.storage.from('resumes').remove([storagePath])
    return NextResponse.json(
      { error: 'Failed to save resume record', details: dbError.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { ...resume, signed_url: signedUrlData?.signedUrl ?? null },
    { status: 201 }
  )
}

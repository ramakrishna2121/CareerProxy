'use client'

import { useEffect, useRef, useState } from 'react'
import type { Resume } from '@/types'

interface ResumeWithUrl extends Resume {
  signed_url: string | null
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  async function fetchResumes() {
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch('/api/v1/resumes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch resumes')
      const data: ResumeWithUrl[] = await res.json()
      setResumes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploading(true)

    const token = getToken()
    if (!token) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/v1/resumes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed')
        return
      }

      setResumes((prev) => [data, ...prev])
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleActivate(id: string) {
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch(`/api/v1/resumes/${id}/activate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to activate resume')
      setResumes((prev) =>
        prev.map((r) => ({ ...r, is_active: r.id === id }))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate resume')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this resume?')) return

    const token = getToken()
    if (!token) return

    try {
      const res = await fetch(`/api/v1/resumes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete resume')
      setResumes((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete resume')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume Vault</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage your resumes. Mark one as active for applications.
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <span
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              uploading
                ? 'cursor-not-allowed bg-indigo-400'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Resume
              </>
            )}
          </span>
        </label>
      </div>

      {uploadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      <p className="mb-4 text-xs text-gray-500">
        Accepted formats: PDF, DOCX. Maximum file size: 10MB.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-600">No resumes yet</p>
          <p className="mt-1 text-xs text-gray-400">Upload your first resume to get started</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">File Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Uploaded</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumes.map((resume) => (
                <tr key={resume.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {resume.signed_url ? (
                      <a
                        href={resume.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {resume.file_name}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-700">{resume.file_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 uppercase text-gray-500">{resume.file_type}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(resume.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {resume.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!resume.is_active && (
                        <button
                          onClick={() => handleActivate(resume.id)}
                          className="rounded px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

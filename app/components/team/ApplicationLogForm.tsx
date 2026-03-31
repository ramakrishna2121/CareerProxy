'use client'

import { useState } from 'react'
import { JobBoard } from '@/types'

const JOB_BOARDS: JobBoard[] = ['LinkedIn', 'Indeed', 'Glassdoor']

interface ApplicationLogFormProps {
  candidateId: string
  onSuccess?: () => void
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export default function ApplicationLogForm({ candidateId, onSuccess }: ApplicationLogFormProps) {
  const [form, setForm] = useState({
    company: '',
    job_title: '',
    job_board: 'LinkedIn' as JobBoard,
    job_url: '',
    applied_at: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const token = getToken()
      const res = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          company: form.company,
          job_title: form.job_title,
          job_board: form.job_board,
          job_url: form.job_url,
          applied_at: form.applied_at ? new Date(form.applied_at).toISOString() : undefined,
          notes: form.notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Daily application limit reached for this candidate.')
        }
        throw new Error(data.error ?? 'Failed to log application')
      }

      setSuccess(true)
      setForm({
        company: '',
        job_title: '',
        job_board: 'LinkedIn',
        job_url: '',
        applied_at: new Date().toISOString().split('T')[0],
        notes: '',
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Log a New Application</h2>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          Application logged successfully.
        </div>
      )}

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          Company <span className="text-red-500">*</span>
        </label>
        <input
          id="company"
          name="company"
          type="text"
          required
          value={form.company}
          onChange={handleChange}
          placeholder="Acme Corp"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          id="job_title"
          name="job_title"
          type="text"
          required
          value={form.job_title}
          onChange={handleChange}
          placeholder="Software Engineer"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="job_board" className="block text-sm font-medium text-gray-700 mb-1">
          Job Board <span className="text-red-500">*</span>
        </label>
        <select
          id="job_board"
          name="job_board"
          required
          value={form.job_board}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {JOB_BOARDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="job_url" className="block text-sm font-medium text-gray-700 mb-1">
          Job URL <span className="text-red-500">*</span>
        </label>
        <input
          id="job_url"
          name="job_url"
          type="url"
          required
          value={form.job_url}
          onChange={handleChange}
          placeholder="https://linkedin.com/jobs/..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="applied_at" className="block text-sm font-medium text-gray-700 mb-1">
          Date Applied
        </label>
        <input
          id="applied_at"
          name="applied_at"
          type="date"
          value={form.applied_at}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          placeholder="Any additional notes about this application..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Logging...' : 'Log Application'}
      </button>
    </form>
  )
}

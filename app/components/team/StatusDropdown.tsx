'use client'

import { useState } from 'react'
import { ApplicationStatus } from '@/types'

const STATUS_OPTIONS: ApplicationStatus[] = [
  'applied',
  'viewed',
  'interview_scheduled',
  'rejected',
  'offer',
  'withdrawn',
]

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  viewed: 'Viewed',
  interview_scheduled: 'Interview Scheduled',
  rejected: 'Rejected',
  offer: 'Offer',
  withdrawn: 'Withdrawn',
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-100 text-blue-700',
  viewed: 'bg-yellow-100 text-yellow-700',
  interview_scheduled: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
  offer: 'bg-green-100 text-green-700',
  withdrawn: 'bg-gray-100 text-gray-600',
}

interface StatusDropdownProps {
  applicationId: string
  currentStatus: ApplicationStatus
  onChange?: () => void
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export default function StatusDropdown({
  applicationId,
  currentStatus,
  onChange,
}: StatusDropdownProps) {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(newStatus: ApplicationStatus) {
    if (newStatus === status) return
    setSaving(true)
    setError(null)
    try {
      const token = getToken()
      const res = await fetch(`/api/v1/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Update failed')
      }
      setStatus(newStatus)
      onChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as ApplicationStatus)}
        disabled={saving}
        className={`appearance-none rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_COLORS[status]} ${
          saving ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        title="Update status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && (
        <div className="absolute left-0 top-full mt-1 z-10 rounded bg-red-50 border border-red-200 px-2 py-1 text-xs text-red-700 whitespace-nowrap shadow-sm">
          {error}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DailyProgressBar from '@/components/team/DailyProgressBar'
import { Profile, SubscriptionPlan } from '@/types'

interface CandidateCard {
  id: string
  full_name: string
  email: string
  plan: SubscriptionPlan | null
  status: 'active' | 'paused' | 'inactive'
  today_count: number
  daily_limit: number | null
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export default function TeamDashboardPage() {
  const [candidates, setCandidates] = useState<CandidateCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = getToken()
        const res = await fetch('/api/v1/team/candidates', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const json = await res.json()
        setCandidates(json.data ?? [])
      } catch (err) {
        setError('Failed to load candidates. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading candidates...</div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Candidates</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track applications for your assigned candidates.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {candidates.length === 0 && !error ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">No candidates assigned yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{c.full_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {c.plan && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.plan === 'premium'
                        ? 'bg-purple-100 text-purple-700'
                        : c.plan === 'pro'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.plan.charAt(0).toUpperCase() + c.plan.slice(1)}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : c.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Daily progress */}
              <DailyProgressBar
                candidateId={c.id}
                todayCount={c.today_count}
                dailyLimit={c.daily_limit}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/team/candidates/${c.id}`}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href={`/team/candidates/${c.id}?tab=log`}
                  className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Log Application
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import ApplicationLogForm from '@/components/team/ApplicationLogForm'
import BulkImportForm from '@/components/team/BulkImportForm'
import StatusDropdown from '@/components/team/StatusDropdown'
import DailyProgressBar from '@/components/team/DailyProgressBar'
import { Application, ApplicationStatus, JobPreferences, Profile, SubscriptionPlan, PLAN_DAILY_LIMITS } from '@/types'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type Tab = 'overview' | 'log' | 'bulk'

interface CandidateData {
  profile: Profile
  preferences: JobPreferences | null
  resumeUrl: string | null
  applications: Application[]
  todayCount: number
  dailyLimit: number | null
}

export default function CandidateProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = use(params)
  const { tab: tabParam } = use(searchParams)

  const [activeTab, setActiveTab] = useState<Tab>((tabParam as Tab) ?? 'overview')
  const [data, setData] = useState<CandidateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    try {
      const headers = authHeaders()

      const [profileRes, prefsRes, appsRes] = await Promise.all([
        fetch(`/api/v1/candidates/${id}/profile`, { headers }),
        fetch(`/api/v1/candidates/${id}/preferences`, { headers }),
        fetch(`/api/v1/applications?candidate_id=${id}&limit=100`, { headers }),
      ])

      const profile: Profile = profileRes.ok ? await profileRes.json() : null
      const preferences: JobPreferences | null = prefsRes.ok ? (await prefsRes.json()).data ?? null : null
      const appsJson = appsRes.ok ? await appsRes.json() : { data: [] }
      const applications: Application[] = appsJson.data ?? []

      // Fetch resume signed URL
      let resumeUrl: string | null = null
      const resumeRes = await fetch(`/api/v1/candidates/${id}/resume/signed-url`, { headers })
      if (resumeRes.ok) {
        const resumeJson = await resumeRes.json()
        resumeUrl = resumeJson.url ?? null
      }

      // Calculate today's count
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const todayCount = applications.filter(
        (a) => !a.deleted_at && new Date(a.applied_at) >= today
      ).length

      const plan = (profile?.plan ?? 'starter') as SubscriptionPlan
      const dailyLimit = PLAN_DAILY_LIMITS[plan]

      setData({ profile, preferences, resumeUrl, applications, todayCount, dailyLimit })
    } catch (err) {
      setError('Failed to load candidate data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  function handleApplicationSaved() {
    setActiveTab('overview')
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading candidate profile...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-8 py-6">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error ?? 'Candidate not found.'}</div>
      </div>
    )
  }

  const { profile, preferences, resumeUrl, applications, todayCount, dailyLimit } = data

  return (
    <div className="px-8 py-6">
      {/* Back link */}
      <Link href="/team/dashboard" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile?.full_name ?? 'Unknown'}</h1>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {profile?.plan && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                profile.plan === 'premium'
                  ? 'bg-purple-100 text-purple-700'
                  : profile.plan === 'pro'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan
              </span>
            )}
            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                Download Resume
              </a>
            ) : (
              <span className="text-xs text-gray-400">No resume uploaded</span>
            )}
          </div>
        </div>

        {/* Daily progress */}
        <div className="mt-4">
          <DailyProgressBar candidateId={id} todayCount={todayCount} dailyLimit={dailyLimit} />
        </div>
      </div>

      {/* Job preferences */}
      {preferences && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Job Preferences</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {preferences.target_titles?.length > 0 && (
              <>
                <dt className="text-gray-500 font-medium">Target Titles</dt>
                <dd className="text-gray-800">{preferences.target_titles.join(', ')}</dd>
              </>
            )}
            {preferences.locations?.length > 0 && (
              <>
                <dt className="text-gray-500 font-medium">Locations</dt>
                <dd className="text-gray-800">{preferences.locations.join(', ')}</dd>
              </>
            )}
            {preferences.industries?.length > 0 && (
              <>
                <dt className="text-gray-500 font-medium">Industries</dt>
                <dd className="text-gray-800">{preferences.industries.join(', ')}</dd>
              </>
            )}
            {preferences.work_type && (
              <>
                <dt className="text-gray-500 font-medium">Work Type</dt>
                <dd className="text-gray-800 capitalize">{preferences.work_type}</dd>
              </>
            )}
            {(preferences.salary_min || preferences.salary_max) && (
              <>
                <dt className="text-gray-500 font-medium">Salary Range</dt>
                <dd className="text-gray-800">
                  {preferences.salary_min ? `$${preferences.salary_min.toLocaleString()}` : '—'} –{' '}
                  {preferences.salary_max ? `$${preferences.salary_max.toLocaleString()}` : '—'}
                </dd>
              </>
            )}
            <dt className="text-gray-500 font-medium">Visa Sponsorship</dt>
            <dd className="text-gray-800">{preferences.visa_sponsorship ? 'Required' : 'Not required'}</dd>
          </dl>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex gap-6">
            {(['overview', 'log', 'bulk'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' ? 'Application History' : tab === 'log' ? 'Log Application' : 'Bulk Import'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <ApplicationHistoryTable
              applications={applications}
              onStatusChange={loadData}
            />
          )}
          {activeTab === 'log' && (
            <ApplicationLogForm candidateId={id} onSuccess={handleApplicationSaved} />
          )}
          {activeTab === 'bulk' && (
            <BulkImportForm candidateId={id} onSuccess={handleApplicationSaved} />
          )}
        </div>
      </div>
    </div>
  )
}

function ApplicationHistoryTable({
  applications,
  onStatusChange,
}: {
  applications: Application[]
  onStatusChange: () => void
}) {
  if (applications.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">No applications logged yet.</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="pb-3 pr-4">Company</th>
            <th className="pb-3 pr-4">Job Title</th>
            <th className="pb-3 pr-4">Board</th>
            <th className="pb-3 pr-4">Applied At</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4 font-medium text-gray-900">
                <a
                  href={app.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 hover:underline"
                >
                  {app.company}
                </a>
              </td>
              <td className="py-3 pr-4 text-gray-700">{app.job_title}</td>
              <td className="py-3 pr-4 text-gray-500">{app.job_board}</td>
              <td className="py-3 pr-4 text-gray-500">
                {new Date(app.applied_at).toLocaleDateString()}
              </td>
              <td className="py-3 pr-4">
                <StatusDropdown
                  applicationId={app.id}
                  currentStatus={app.status}
                  onChange={onStatusChange}
                />
              </td>
              <td className="py-3 text-gray-500 max-w-xs truncate">{app.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

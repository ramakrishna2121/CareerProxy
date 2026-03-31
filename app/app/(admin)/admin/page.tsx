'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Metrics, SubscriptionPlan, SubscriptionStatus } from '@/types'

type Tab = 'candidates' | 'team' | 'subscriptions' | 'metrics'

interface Candidate {
  id: string
  email: string
  full_name: string
  status: string
  created_at: string
  subscriptions: Array<{ plan: SubscriptionPlan; status: SubscriptionStatus; stripe_subscription_id: string }>
  team_assignments: Array<{ team_member_id: string; profiles: { full_name: string; email: string } | null }>
}

interface TeamMember {
  id: string
  email: string
  full_name: string
  status: string
  created_at: string
  candidate_count: number
}

interface Subscription {
  id: string
  candidate_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_end: string
  stripe_subscription_id: string
  stripe_customer_id: string
  profiles?: { full_name: string; email: string }
}

// ---------- Helpers ----------

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}
    >
      {label}
    </span>
  )
}

function planBadge(plan: string) {
  const colors: Record<string, string> = {
    starter: 'bg-slate-100 text-slate-700',
    pro: 'bg-indigo-100 text-indigo-700',
    premium: 'bg-amber-100 text-amber-700',
  }
  return <Badge label={plan} color={colors[plan] ?? 'bg-slate-100 text-slate-700'} />
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-slate-100 text-slate-500',
    canceled: 'bg-red-100 text-red-700',
    past_due: 'bg-orange-100 text-orange-700',
  }
  return <Badge label={status} color={colors[status] ?? 'bg-slate-100 text-slate-700'} />
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

// ---------- Tabs ----------

function CandidatesTab({ token, teamMembers }: { token: string; teamMembers: TeamMember[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (planFilter) params.set('plan', planFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (teamFilter) params.set('team_member_id', teamFilter)

    const res = await fetch(`/api/v1/admin/candidates?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setCandidates(json.data)
      setTotal(json.total)
    }
    setLoading(false)
  }, [token, page, planFilter, statusFilter, teamFilter])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  const handleAssign = async (candidateId: string, newTeamMemberId: string) => {
    if (!newTeamMemberId) return
    await fetch(`/api/v1/admin/team/${newTeamMemberId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ candidate_ids: [candidateId] }),
    })
    fetchCandidates()
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={teamFilter}
          onChange={(e) => { setTeamFilter(e.target.value); setPage(1) }}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Team Members</option>
          {teamMembers.map((tm) => (
            <option key={tm.id} value={tm.id}>{tm.full_name}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500 self-center">{total} candidate{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Team Member</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : candidates.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No candidates found.</td></tr>
            ) : candidates.map((c) => {
              const sub = c.subscriptions?.[0]
              const assignment = c.team_assignments?.[0]
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email}</td>
                  <td className="px-4 py-3">{sub ? planBadge(sub.plan) : <span className="text-slate-400 text-xs">—</span>}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={assignment?.team_member_id ?? ''}
                      onChange={(e) => handleAssign(c.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white max-w-[160px]"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((tm) => (
                        <option key={tm.id} value={tm.id}>{tm.full_name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-slate-500">Page {page} of {Math.ceil(total / 25)}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 25 >= total}
            className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function TeamMembersTab({ token }: { token: string }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const fetchTeam = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/v1/admin/team', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setTeamMembers(json)
    }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/v1/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowCreate(false)
      setForm({ email: '', full_name: '' })
      fetchTeam()
    } else {
      const json = await res.json()
      setCreateError(json.error ?? 'Failed to create team member')
    }
    setCreating(false)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Create Team Member
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">New Team Member</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="jane@careerproxy.com"
              />
            </div>
            {createError && <p className="text-red-600 text-sm">{createError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Candidates Assigned</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : teamMembers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No team members yet.</td></tr>
            ) : teamMembers.map((tm) => (
              <tr key={tm.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{tm.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{tm.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                    {tm.candidate_count}
                  </span>
                </td>
                <td className="px-4 py-3">{statusBadge(tm.status)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(tm.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SubscriptionsTab({ token }: { token: string }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const [actionState, setActionState] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchSubs() {
      setLoading(true)
      // Use admin client to fetch all subscriptions with profile data
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/v1/admin/candidates?limit=100', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json()
        const subs: Subscription[] = []
        for (const candidate of json.data) {
          for (const sub of (candidate.subscriptions ?? [])) {
            subs.push({ ...sub, candidate_id: candidate.id, profiles: { full_name: candidate.full_name, email: candidate.email } })
          }
        }
        setSubscriptions(subs)
      }
      setLoading(false)
    }
    fetchSubs()
  }, [token])

  const handlePlanChange = async (subId: string, stripeSubId: string) => {
    const newPlan = prompt('Enter new plan (starter, pro, premium):')
    if (!newPlan) return
    setActionState((s) => ({ ...s, [subId]: 'Changing...' }))
    const res = await fetch('/api/v1/admin/billing/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stripe_subscription_id: stripeSubId, new_plan: newPlan }),
    })
    setActionState((s) => ({ ...s, [subId]: res.ok ? 'Changed!' : 'Failed' }))
    setTimeout(() => setActionState((s) => ({ ...s, [subId]: '' })), 3000)
  }

  const handleRefund = async (subId: string, stripeSubId: string) => {
    if (!confirm('Issue a full refund for the latest payment on this subscription?')) return
    setActionState((s) => ({ ...s, [subId]: 'Refunding...' }))
    const res = await fetch('/api/v1/admin/billing/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stripe_subscription_id: stripeSubId }),
    })
    setActionState((s) => ({ ...s, [subId]: res.ok ? 'Refunded!' : 'Failed' }))
    setTimeout(() => setActionState((s) => ({ ...s, [subId]: '' })), 3000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Candidate</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Period End</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
          ) : subscriptions.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No subscriptions found.</td></tr>
          ) : subscriptions.map((sub) => (
            <tr key={sub.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{sub.profiles?.full_name}</div>
                <div className="text-xs text-slate-500">{sub.profiles?.email}</div>
              </td>
              <td className="px-4 py-3">{planBadge(sub.plan)}</td>
              <td className="px-4 py-3">{statusBadge(sub.status)}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(sub.current_period_end)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePlanChange(sub.id, sub.stripe_subscription_id)}
                    className="text-xs px-2 py-1 border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-50"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={() => handleRefund(sub.id, sub.stripe_subscription_id)}
                    className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"
                  >
                    Refund
                  </button>
                  {actionState[sub.id] && (
                    <span className="text-xs text-slate-500 self-center">{actionState[sub.id]}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MetricsTab({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      const res = await fetch('/api/v1/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setMetrics(await res.json())
      }
      setLoading(false)
    }
    fetchMetrics()
  }, [token])

  if (loading) {
    return <p className="text-slate-400 text-sm">Loading metrics...</p>
  }

  if (!metrics) {
    return <p className="text-red-500 text-sm">Failed to load metrics.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Total Candidates"
        value={metrics.total_candidates}
        sub="All registered candidates"
      />
      <StatCard
        label="Active Subscriptions"
        value={metrics.active_subscriptions}
        sub="Currently active plans"
      />
      <StatCard
        label="MRR"
        value={`$${metrics.mrr.toLocaleString()}`}
        sub="Monthly recurring revenue"
      />
      <StatCard
        label="Total Applications"
        value={metrics.total_applications.toLocaleString()}
        sub="Non-deleted applications"
      />
      <StatCard
        label="Avg Apps / Candidate"
        value={metrics.avg_apps_per_candidate.toFixed(1)}
        sub="Applications per candidate (lifetime)"
      />
    </div>
  )
}

// ---------- Main Page ----------

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('candidates')
  const [token, setToken] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setToken(session.access_token)
    })
  }, [])

  // Pre-load team members for the assignment dropdown in CandidatesTab
  useEffect(() => {
    if (!token) return
    fetch('/api/v1/admin/team', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTeamMembers)
      .catch(() => {})
  }, [token])

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'candidates', label: 'Candidates' },
    { key: 'team', label: 'Team Members' },
    { key: 'subscriptions', label: 'Subscriptions' },
    { key: 'metrics', label: 'Metrics' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 text-sm mt-1">Manage candidates, team, billing, and view platform metrics.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {token && (
        <>
          {activeTab === 'candidates' && <CandidatesTab token={token} teamMembers={teamMembers} />}
          {activeTab === 'team' && <TeamMembersTab token={token} />}
          {activeTab === 'subscriptions' && <SubscriptionsTab token={token} />}
          {activeTab === 'metrics' && <MetricsTab token={token} />}
        </>
      )}
    </div>
  )
}

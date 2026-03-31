'use client'

import { useEffect, useState } from 'react'
import type { Subscription, SubscriptionPlan } from '@/types'
import { PLAN_FEATURES, PLAN_PRICES_USD } from '@/types'

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-yellow-100 text-yellow-700',
  canceled: 'bg-gray-100 text-gray-600',
  incomplete: 'bg-red-100 text-red-700',
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  function getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch('/api/v1/subscriptions/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 404) return null
        if (!res.ok) throw new Error('Failed to load subscription')
        return res.json()
      })
      .then((data: Subscription | null) => setSubscription(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleManageBilling() {
    setPortalError(null)
    setPortalLoading(true)

    const token = getToken()
    if (!token) return

    try {
      const res = await fetch('/api/v1/subscriptions/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 404) {
        setPortalError('Billing portal is not available yet. Please contact support.')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setPortalError(data.error ?? 'Failed to open billing portal')
        return
      }

      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        setPortalError('No portal URL returned. Please contact support.')
      }
    } catch {
      setPortalError('Failed to open billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and billing details.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!subscription ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">You don&apos;t have an active subscription.</p>
          <p className="mt-2 text-sm text-gray-500">
            Choose a plan to get started with CareerProxy.
          </p>
          <a
            href="/pricing"
            className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            View Plans
          </a>
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Current Plan Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-bold text-indigo-600">
                    {PLAN_LABELS[subscription.plan]}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLES[subscription.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  ${PLAN_PRICES_USD[subscription.plan]}/month
                </p>
              </div>
            </div>

            {subscription.current_period_end && (
              <p className="mt-4 text-sm text-gray-500">
                {subscription.status === 'canceled'
                  ? `Access ends on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            )}

            {subscription.cancel_at && (
              <p className="mt-1 text-sm text-yellow-600">
                Cancels on {new Date(subscription.cancel_at).toLocaleDateString()}
              </p>
            )}

            {/* Plan Features */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Plan includes:</p>
              <ul className="space-y-1">
                {PLAN_FEATURES[subscription.plan].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Manage Billing */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Manage Billing</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update your payment method, download invoices, or cancel your subscription.
            </p>

            {portalError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {portalError}
              </div>
            )}

            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                portalLoading
                  ? 'cursor-not-allowed bg-indigo-400'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {portalLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Opening portal...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Manage Billing
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  PLAN_FEATURES,
  PLAN_PRICES_USD,
  type SubscriptionPlan,
  type WorkType,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Data {
  file: File | null
}

interface Step2Data {
  target_titles: string
  industries: string
  locations: string
  work_type: WorkType | ''
  visa_sponsorship: boolean
}

interface Step3Data {
  plan: SubscriptionPlan | null
}

// ─── Step indicators ──────────────────────────────────────────────────────────

const STEPS = ['Resume', 'Preferences', 'Plan']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1
        const isCompleted = stepNum < current
        const isCurrent = stepNum === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'bg-indigo-600 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isCurrent ? 'text-indigo-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 sm:w-24 mx-1 mb-5 transition-colors ${
                  isCompleted ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Plan cards ───────────────────────────────────────────────────────────────

const plans: { key: SubscriptionPlan; name: string; highlight: boolean }[] = [
  { key: 'starter', name: 'Starter', highlight: false },
  { key: 'pro', name: 'Pro', highlight: true },
  { key: 'premium', name: 'Premium', highlight: false },
]

// ─── Main component ───────────────────────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Step data
  const [step1, setStep1] = useState<Step1Data>({ file: null })
  const [step2, setStep2] = useState<Step2Data>({
    target_titles: '',
    industries: '',
    locations: '',
    work_type: '',
    visa_sponsorship: false,
  })
  const [step3, setStep3] = useState<Step3Data>({
    plan: (searchParams.get('plan') as SubscriptionPlan | null) ?? null,
  })

  // Per-step loading
  const [loadingStep, setLoadingStep] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)

  // Verify auth on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
      }
    }
    checkAuth()
  }, [router])

  // ── Step 1: Resume upload ─────────────────────────────────────────────────

  async function handleStep1(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStepError(null)

    if (!step1.file) {
      setStepError('Please select a resume file before continuing.')
      return
    }

    setLoadingStep(true)
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('file', step1.file)

      const res = await fetch('/api/v1/resumes', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      // API may not exist yet — tolerate non-2xx gracefully
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Non-fatal: warn and continue
        console.warn('Resume upload failed:', data.error ?? res.status)
      }

      setStep(2)
    } catch {
      // Network errors are non-fatal for onboarding — continue anyway
      console.warn('Resume upload network error — continuing onboarding')
      setStep(2)
    } finally {
      setLoadingStep(false)
    }
  }

  function handleSkipStep1() {
    setStepError(null)
    setStep(2)
  }

  // ── Step 2: Job preferences ───────────────────────────────────────────────

  async function handleStep2(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStepError(null)

    if (!step2.target_titles.trim()) {
      setStepError('Please enter at least one target job title.')
      return
    }

    setLoadingStep(true)
    try {
      const token = localStorage.getItem('access_token')
      const payload = {
        target_titles: step2.target_titles
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        industries: step2.industries
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        locations: step2.locations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        work_type: step2.work_type || undefined,
        visa_sponsorship: step2.visa_sponsorship,
      }

      const res = await fetch('/api/v1/candidates/me/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.warn('Preferences save failed:', data.error ?? res.status)
      }

      setStep(3)
    } catch {
      console.warn('Preferences save network error — continuing onboarding')
      setStep(3)
    } finally {
      setLoadingStep(false)
    }
  }

  // ── Step 3: Plan selection ────────────────────────────────────────────────

  async function markOnboardingComplete() {
    const token = localStorage.getItem('access_token')

    // Try API first
    try {
      const res = await fetch('/api/v1/candidates/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ onboarding_complete: true }),
      })
      if (res.ok) return
    } catch {
      // fall through to Supabase client
    }

    // Fall back to direct Supabase client update
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', user.id)
      }
    } catch {
      console.warn('Could not mark onboarding complete — continuing anyway')
    }
  }

  async function handleSelectPlan(plan: SubscriptionPlan) {
    setStep3({ plan })
    setStepError(null)
    setLoadingStep(true)

    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/v1/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.checkout_url) {
          // Mark onboarding complete before redirecting to Stripe
          await markOnboardingComplete()
          window.location.href = data.checkout_url
          return
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setStepError(
          data.error ?? 'Could not start checkout. Please try again or skip for now.'
        )
      }
    } catch {
      setStepError('Network error. Please try again or skip for now.')
    } finally {
      setLoadingStep(false)
    }
  }

  async function handleSkipPlan() {
    setStepError(null)
    setLoadingStep(true)
    await markOnboardingComplete()
    setLoadingStep(false)
    router.push('/dashboard')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-2xl">
        {/* Global error */}
        {globalError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {globalError}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Set up your account</h1>
            <p className="text-slate-500 text-sm mt-1">
              Just a few quick steps to get you started
            </p>
          </div>

          <StepIndicator current={step} />

          {/* ── Step 1 ─────────────────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Upload your resume
                </h2>
                <p className="text-slate-500 text-sm mb-5">
                  Our team will use this to apply on your behalf. PDF or DOCX, max 10 MB.
                </p>

                {stepError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {stepError}
                  </div>
                )}

                <label className="block">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      step1.file
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    {step1.file ? (
                      <div>
                        <svg
                          className="h-8 w-8 text-indigo-600 mx-auto mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-semibold text-indigo-700">
                          {step1.file.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(step1.file.size / 1024 / 1024).toFixed(2)} MB — click to change
                        </p>
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="h-10 w-10 text-slate-400 mx-auto mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="text-sm text-slate-600 font-medium">
                          Click or drag your resume here
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PDF or DOCX up to 10 MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null
                        setStep1({ file: f })
                        setStepError(null)
                      }}
                    />
                  </div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loadingStep || !step1.file}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loadingStep ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    'Upload & Continue'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSkipStep1}
                  className="flex-1 sm:flex-none border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2 ─────────────────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Your job preferences
                </h2>
                <p className="text-slate-500 text-sm mb-5">
                  Tell us what you are looking for so we can target the right opportunities.
                </p>

                {stepError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {stepError}
                  </div>
                )}
              </div>

              {/* Target titles */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target job titles <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={step2.target_titles}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, target_titles: e.target.value }))
                  }
                  placeholder="e.g. Software Engineer, Data Scientist, ML Engineer"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple titles with commas</p>
              </div>

              {/* Industries */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Industries
                </label>
                <input
                  type="text"
                  value={step2.industries}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, industries: e.target.value }))
                  }
                  placeholder="e.g. Technology, Finance, Healthcare"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple industries with commas</p>
              </div>

              {/* Locations */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preferred locations
                </label>
                <input
                  type="text"
                  value={step2.locations}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, locations: e.target.value }))
                  }
                  placeholder="e.g. New York NY, San Francisco CA, Remote"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple locations with commas</p>
              </div>

              {/* Work type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Work type
                </label>
                <select
                  value={step2.work_type}
                  onChange={(e) =>
                    setStep2((p) => ({
                      ...p,
                      work_type: e.target.value as WorkType | '',
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="">No preference</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>

              {/* Visa sponsorship */}
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  id="visa_sponsorship"
                  type="checkbox"
                  checked={step2.visa_sponsorship}
                  onChange={(e) =>
                    setStep2((p) => ({ ...p, visa_sponsorship: e.target.checked }))
                  }
                  className="h-4 w-4 text-indigo-600 rounded border-slate-300 mt-0.5 cursor-pointer"
                />
                <label htmlFor="visa_sponsorship" className="cursor-pointer">
                  <span className="text-sm font-medium text-slate-900">
                    I need visa sponsorship
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    We will only apply to companies that sponsor H-1B and OPT STEM
                    extension.
                  </p>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="sm:w-auto border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loadingStep}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loadingStep ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    'Save & Continue'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3 ─────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Choose your plan
                </h2>
                <p className="text-slate-500 text-sm mb-5">
                  Pick the plan that fits your job search goals. You can change plans at
                  any time.
                </p>

                {stepError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {stepError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.key}
                    className={`rounded-xl border p-5 flex flex-col relative cursor-pointer transition-all ${
                      step3.plan === plan.key
                        ? 'border-indigo-600 ring-2 ring-indigo-600 bg-indigo-50'
                        : plan.highlight
                        ? 'border-indigo-300 shadow-sm'
                        : 'border-slate-200'
                    }`}
                    onClick={() => setStep3({ plan: plan.key })}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1 mb-3">
                      <span className="text-2xl font-extrabold text-slate-900">
                        ${PLAN_PRICES_USD[plan.key]}
                      </span>
                      <span className="text-slate-500 text-xs">/mo</span>
                    </div>
                    <ul className="space-y-1.5 flex-1">
                      {PLAN_FEATURES[plan.key].map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <svg
                            className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {step3.plan === plan.key && (
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-indigo-700 text-xs font-semibold">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="sm:w-auto border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2.5 px-6 rounded-lg text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loadingStep || !step3.plan}
                  onClick={() => step3.plan && handleSelectPlan(step3.plan)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loadingStep ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Redirecting to checkout…
                    </>
                  ) : (
                    'Subscribe & Start'
                  )}
                </button>
                <button
                  type="button"
                  disabled={loadingStep}
                  onClick={handleSkipPlan}
                  className="sm:w-auto border border-slate-300 text-slate-500 hover:bg-slate-50 font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
                >
                  Skip for now
                </button>
              </div>
              <p className="text-center text-xs text-slate-400">
                You can subscribe at any time from your dashboard billing settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-slate-500">Loading...</div></div>}>
      <OnboardingContent />
    </Suspense>
  )
}

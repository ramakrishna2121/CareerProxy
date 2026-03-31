'use client'

import { useEffect, useState } from 'react'
import type { JobPreferences, WorkType } from '@/types'

const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [inputValue, setInputValue] = useState('')

  function addTag() {
    const trimmed = inputValue.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setInputValue('')
  }

  function removeTag(tag: string) {
    onChange(values.filter((v) => v !== tag))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-2 min-h-[44px]">
        {values.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-indigo-500 hover:text-indigo-700"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag()
            }
          }}
          onBlur={addTag}
          placeholder={values.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[120px] border-none outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">Press Enter or comma to add</p>
    </div>
  )
}

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [targetTitles, setTargetTitles] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [workType, setWorkType] = useState<WorkType | ''>('')
  const [salaryMin, setSalaryMin] = useState<string>('')
  const [salaryMax, setSalaryMax] = useState<string>('')
  const [visaSponsorship, setVisaSponsorship] = useState(false)

  function getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch('/api/v1/candidates/me/preferences', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok && res.status !== 404) throw new Error('Failed to load preferences')
        return res.json()
      })
      .then((data: JobPreferences | null) => {
        if (data) {
          setTargetTitles(data.target_titles ?? [])
          setIndustries(data.industries ?? [])
          setLocations(data.locations ?? [])
          setWorkType((data.work_type ?? '') as WorkType | '')
          setSalaryMin(data.salary_min != null ? String(data.salary_min) : '')
          setSalaryMax(data.salary_max != null ? String(data.salary_max) : '')
          setVisaSponsorship(data.visa_sponsorship ?? false)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    setSaving(true)

    const token = getToken()
    if (!token) return

    const payload = {
      target_titles: targetTitles,
      industries,
      locations,
      work_type: workType || null,
      salary_min: salaryMin ? parseInt(salaryMin, 10) : null,
      salary_max: salaryMax ? parseInt(salaryMax, 10) : null,
      visa_sponsorship: visaSponsorship,
    }

    try {
      const res = await fetch('/api/v1/candidates/me/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save preferences')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Job Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tell us what you&apos;re looking for so we can find the best matches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
          <TagInput
            label="Target Job Titles"
            values={targetTitles}
            onChange={setTargetTitles}
            placeholder="e.g. Software Engineer, Product Manager"
          />

          <TagInput
            label="Industries"
            values={industries}
            onChange={setIndustries}
            placeholder="e.g. Technology, Finance, Healthcare"
          />

          <TagInput
            label="Preferred Locations"
            values={locations}
            onChange={setLocations}
            placeholder="e.g. New York, Remote, San Francisco"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Type
            </label>
            <div className="flex gap-3">
              {WORK_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    workType === opt.value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="work_type"
                    value={opt.value}
                    checked={workType === opt.value}
                    onChange={() => setWorkType(opt.value)}
                    className="hidden"
                  />
                  {opt.label}
                </label>
              ))}
              {workType && (
                <button
                  type="button"
                  onClick={() => setWorkType('')}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Salary ($)
              </label>
              <input
                id="salary_min"
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g. 80000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Salary ($)
              </label>
              <input
                id="salary_max"
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={visaSponsorship}
              onClick={() => setVisaSponsorship((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                visaSponsorship ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  visaSponsorship ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <label className="text-sm font-medium text-gray-700">
              Visa sponsorship required
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Preferences saved successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors ${
            saving ? 'cursor-not-allowed bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </form>
    </div>
  )
}

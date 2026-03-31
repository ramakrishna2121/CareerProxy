'use client'

import { useState, useRef } from 'react'
import { JobBoard } from '@/types'

const VALID_JOB_BOARDS: JobBoard[] = ['LinkedIn', 'Indeed', 'Glassdoor']

interface CsvRow {
  company: string
  job_title: string
  job_board: string
  job_url: string
  applied_at: string
  notes: string
}

interface ImportResult {
  imported: number
  failed: number
  errors: { row: number; error: string }[]
}

interface BulkImportFormProps {
  candidateId: string
  onSuccess?: () => void
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
  const expectedCols = ['company', 'job_title', 'job_board', 'job_url', 'applied_at', 'notes']

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split (handles quoted values with no commas inside)
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    header.forEach((col, idx) => {
      row[col] = values[idx] ?? ''
    })
    rows.push({
      company: row['company'] ?? '',
      job_title: row['job_title'] ?? '',
      job_board: row['job_board'] ?? '',
      job_url: row['job_url'] ?? '',
      applied_at: row['applied_at'] ?? '',
      notes: row['notes'] ?? '',
    })
  }
  return rows
}

export default function BulkImportForm({ candidateId, onSuccess }: BulkImportFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<CsvRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setResult(null)
    setParseError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      try {
        const rows = parseCsv(text)
        if (rows.length === 0) {
          setParseError('No valid rows found. Make sure the CSV has a header row and data rows.')
          setPreview([])
        } else {
          setPreview(rows)
        }
      } catch {
        setParseError('Failed to parse CSV file.')
        setPreview([])
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (preview.length === 0) return
    setSubmitting(true)
    setResult(null)

    try {
      const token = getToken()
      const payload = preview.map((row) => ({
        candidate_id: candidateId,
        company: row.company,
        job_title: row.job_title,
        job_board: row.job_board,
        job_url: row.job_url,
        applied_at: row.applied_at || undefined,
        notes: row.notes || undefined,
      }))

      const res = await fetch('/api/v1/applications/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const data: ImportResult = await res.json()

      if (!res.ok) {
        throw new Error((data as unknown as { error?: string }).error ?? 'Bulk import failed')
      }

      setResult(data)
      if (data.imported > 0) {
        onSuccess?.()
      }
    } catch (err) {
      setResult({
        imported: 0,
        failed: preview.length,
        errors: [{ row: 0, error: err instanceof Error ? err.message : 'Unknown error' }],
      })
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setPreview([])
    setFileName(null)
    setResult(null)
    setParseError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Bulk CSV Import</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV file with columns:{' '}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            company, job_title, job_board, job_url, applied_at, notes
          </code>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supported job boards: {VALID_JOB_BOARDS.join(', ')}
        </p>
      </div>

      {/* File upload */}
      <div>
        <label
          htmlFor="csv-upload"
          className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm text-gray-500">
            {fileName ? fileName : 'Click to upload or drag and drop a CSV file'}
          </span>
          <input
            id="csv-upload"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {parseError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{parseError}</div>
      )}

      {/* Preview table */}
      {preview.length > 0 && !result && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Preview — {preview.length} row{preview.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Company</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Job Title</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Board</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">URL</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Applied At</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {preview.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="px-3 py-2 text-gray-900">{row.company || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-3 py-2 text-gray-700">{row.job_title || <span className="text-red-400 italic">missing</span>}</td>
                    <td className={`px-3 py-2 ${VALID_JOB_BOARDS.includes(row.job_board as JobBoard) ? 'text-gray-700' : 'text-red-500'}`}>
                      {row.job_board || <span className="italic">missing</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-500 max-w-[160px] truncate">{row.job_url || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-3 py-2 text-gray-500">{row.applied_at || <span className="italic text-gray-400">today</span>}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50 border-t border-gray-200">
                Showing first 50 of {preview.length} rows.
              </p>
            )}
          </div>
          <button
            onClick={handleImport}
            disabled={submitting}
            className="mt-3 rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Importing...' : `Import ${preview.length} Application${preview.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Import result summary */}
      {result && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Import Complete</h3>
          </div>
          <div className="px-5 py-4 flex gap-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-green-600">{result.imported}</span>
              <span className="text-xs text-gray-500 mt-0.5">Imported</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-red-600">{result.failed}</span>
              <span className="text-xs text-gray-500 mt-0.5">Failed</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Errors:</p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">
                    {e.row > 0 ? `Row ${e.row}: ` : ''}{e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="px-5 pb-4">
            <button
              onClick={handleReset}
              className="text-sm text-indigo-600 hover:underline"
            >
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

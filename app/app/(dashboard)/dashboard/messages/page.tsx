'use client'

import { useState, useEffect, useCallback } from 'react'
import MessageThread from '@/components/messaging/MessageThread'
import MessageInput from '@/components/messaging/MessageInput'
import { Message } from '@/types'

function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/)
  if (match) return decodeURIComponent(match[1])
  // Fallback: check localStorage for Supabase session
  try {
    const raw = localStorage.getItem(
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
    )
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed?.access_token ?? null
    }
  } catch {
    // ignore
  }
  return null
}

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planBlocked, setPlanBlocked] = useState(false)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = getToken()
    setToken(t)
    if (t) {
      setCandidateId(getUserIdFromToken(t))
    }
  }, [])

  const fetchMessages = useCallback(async () => {
    if (!candidateId || !token) return
    try {
      const res = await fetch(`/api/v1/messages/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 403) {
        const data = await res.json()
        if (data.error?.toLowerCase().includes('pro') || data.error?.toLowerCase().includes('plan')) {
          setPlanBlocked(true)
          setLoading(false)
          return
        }
        setError(data.error ?? 'Access denied')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError('Failed to load messages')
        setLoading(false)
        return
      }

      const data = await res.json()
      setMessages(data)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [candidateId, token])

  useEffect(() => {
    if (candidateId && token) {
      fetchMessages()
    }
  }, [candidateId, token, fetchMessages])

  const handleSend = async (content: string) => {
    if (!candidateId || !token) return
    const res = await fetch(`/api/v1/messages/${candidateId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to send message')
    }

    // Refresh the thread after sending
    await fetchMessages()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-slate-500 text-sm">Loading messages…</p>
      </div>
    )
  }

  if (planBlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-sm">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">
            Messaging requires Pro or Premium
          </h2>
          <p className="text-sm text-amber-700 mb-4">
            Upgrade your plan to unlock direct messaging with your job search team.
          </p>
          <a
            href="/pricing"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h1 className="text-base font-semibold text-slate-800">Messages</h1>
        <p className="text-xs text-slate-500 mt-0.5">Your conversation with the CareerProxy team</p>
      </div>

      {/* Thread */}
      <MessageThread messages={messages} currentUserId={candidateId ?? ''} />

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  )
}

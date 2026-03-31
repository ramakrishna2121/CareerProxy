'use client'

import { useState, useEffect, useCallback } from 'react'
import MessageThread from './MessageThread'
import MessageInput from './MessageInput'
import { Message } from '@/types'

interface CandidateMessagePanelProps {
  candidateId: string
  token: string
  teamMemberId: string
}

/**
 * Messaging panel for team members within the candidate profile view.
 * Pass in the candidateId, the auth token, and the current team member's userId.
 */
export default function CandidateMessagePanel({
  candidateId,
  token,
  teamMemberId,
}: CandidateMessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planBlocked, setPlanBlocked] = useState(false)

  const fetchMessages = useCallback(async () => {
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
    fetchMessages()
  }, [fetchMessages])

  const handleSend = async (content: string) => {
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

    await fetchMessages()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-slate-500 text-sm">Loading messages…</p>
      </div>
    )
  }

  if (planBlocked) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center">
        <p className="text-sm font-medium text-amber-800">
          This candidate is on the Starter plan — messaging is not available.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          They must upgrade to Pro or Premium to use messaging.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] rounded-xl border border-slate-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Candidate Messages</h3>
      </div>

      {/* Thread */}
      <MessageThread messages={messages} currentUserId={teamMemberId} />

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  )
}

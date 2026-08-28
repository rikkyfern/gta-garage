'use client'
import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import Link from 'next/link'
import { ArrowLeft, Check, Mail, X } from 'lucide-react'

interface Request {
  id: string
  sender: { id: string; username: string; avatar: string | null; bio: string | null }
}

export default function FriendRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRequests() {
      try {
        const res = await fetch('/api/friends/requests')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Could not load requests')
        if (active) setRequests(data.requests ?? [])
      } catch {
        if (active) setError('Could not load friend requests. Please refresh and try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRequests()
    return () => {
      active = false
    }
  }, [])

  async function handle(requestId: string, action: 'accept' | 'reject') {
    setProcessingId(requestId)
    await fetch(`/api/friends/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    })
    setRequests((prev) => prev.filter((r) => r.id !== requestId))
    setProcessingId(null)
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/friends" className="muted-link mb-3 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Friends
          </Link>
          <p className="eyebrow mb-2">Crew invites</p>
          <h1 className="page-title">Friend Requests</h1>
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : requests.length === 0 ? (
        <EmptyState icon={<Mail className="h-7 w-7" aria-hidden="true" />} title="No pending requests" description="You're all caught up." />
      ) : (
        <div className="space-y-3 max-w-lg">
          {requests.map((r) => (
            <div key={r.id} className="card flex items-center gap-3 p-4">
              <Avatar src={r.sender.avatar} username={r.sender.username} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-garage-text">{r.sender.username}</p>
                {r.sender.bio && <p className="text-xs text-garage-subtle truncate">{r.sender.bio}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handle(r.id, 'accept')}
                  disabled={processingId === r.id}
                  className="btn-primary text-sm px-3 py-1.5"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Accept
                </button>
                <button
                  onClick={() => handle(r.id, 'reject')}
                  disabled={processingId === r.id}
                  className="btn-danger text-sm px-3 py-1.5"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

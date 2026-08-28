'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Search, UserPlus, Users, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

interface Friend { id: string; username: string; avatar: string | null; bio: string | null }
interface SearchUser { id: string; username: string; avatar: string | null; bio: string | null }

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [requestCount, setRequestCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    async function loadFriends() {
      try {
        const [friendsRes, requestsRes] = await Promise.all([
          fetch('/api/friends'),
          fetch('/api/friends/requests'),
        ])
        const [friendsData, requestsData] = await Promise.all([
          friendsRes.json(),
          requestsRes.json(),
        ])
        if (!friendsRes.ok) throw new Error(friendsData.error ?? 'Could not load friends')
        if (!requestsRes.ok) throw new Error(requestsData.error ?? 'Could not load requests')
        if (active) {
          setFriends(friendsData.friends ?? [])
          setRequestCount((requestsData.requests ?? []).length)
        }
      } catch {
        if (active) setLoadError('Could not load your crew list. Please refresh and try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadFriends()
    return () => {
      active = false
    }
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim().length < 2) return
    setSearching(true)
    const res = await fetch(`/api/users/search?username=${encodeURIComponent(search)}`)
    const data = await res.json()
    setSearchResults(data.users ?? [])
    setSearching(false)
  }

  async function sendRequest(userId: string) {
    setSendingId(userId)
    setError('')
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: userId }),
    })
    const data = await res.json()
    setSendingId(null)
    if (!res.ok) { setError(data.error); return }
    setSentIds((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => next.add(id))
      next.add(userId)
      return next
    })
  }

  async function removeFriend(friendId: string) {
    setRemovingId(friendId)
    await fetch(`/api/friends/${friendId}`, { method: 'DELETE' })
    setFriends((prev) => prev.filter((f) => f.id !== friendId))
    setRemovingId(null)
  }

  const friendIds = new Set(friends.map((f) => f.id))

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow mb-2">Crew network</p>
          <h1 className="page-title">Friends</h1>
          <p className="mt-2 text-sm text-garage-subtle">Search players, send requests, and manage your crew list.</p>
        </div>
        <Link href="/friends/requests" className="btn-secondary relative text-sm">
          <span className="relative">
            <Bell className="h-4 w-4" aria-hidden="true" />
            {requestCount > 0 && (
              <span className="absolute -right-2 -top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-garage-panel" />
            )}
          </span>
          Requests
          {requestCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {requestCount > 9 ? '9+' : requestCount}
            </span>
          )}
        </Link>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="section-title mb-3">Find Players</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Search by username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={searching}>
            {searching ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>

        {error && <ErrorMessage message={error} />}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border border-garage-border/70 bg-garage-muted/70 p-3">
                <Avatar src={u.avatar} username={u.username} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-garage-text text-sm">{u.username}</p>
                  {u.bio && <p className="text-xs text-garage-subtle truncate">{u.bio}</p>}
                </div>
                {friendIds.has(u.id) ? (
                  <span className="text-xs text-garage-subtle">Friends</span>
                ) : sentIds.has(u.id) ? (
                  <span className="text-xs text-garage-neon">Sent ✓</span>
                ) : (
                  <button
                    onClick={() => sendRequest(u.id)}
                    disabled={sendingId === u.id}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {sendingId === u.id ? '…' : <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />}
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">Roster</p>
          <h2 className="section-title">Your Crew ({friends.length})</h2>
        </div>
      </div>
      {loadError ? (
        <ErrorMessage message={loadError} />
      ) : friends.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" aria-hidden="true" />} title="No friends yet" description="Search for players and send friend requests." />
      ) : (
        <div className="space-y-2">
          {friends.map((f) => (
            <div key={f.id} className="card flex items-center gap-3 p-4">
              <Avatar src={f.avatar} username={f.username} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-garage-text">{f.username}</p>
                {f.bio && <p className="text-xs text-garage-subtle truncate">{f.bio}</p>}
              </div>
              <button
                onClick={() => removeFriend(f.id)}
                disabled={removingId === f.id}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-500/10"
              >
                {removingId === f.id ? '…' : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

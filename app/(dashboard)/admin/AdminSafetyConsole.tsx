'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  Ban,
  Camera,
  CheckCircle2,
  Globe2,
  MessageSquareWarning,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { PageLoader } from '@/components/ui/LoadingSpinner'

type Tab = 'players' | 'warnings' | 'photos' | 'traffic' | 'soc'

interface AdminUser {
  id: string
  username: string
  email: string
  avatar: string | null
  bio: string | null
  role: 'USER' | 'ADMIN'
  emailVerified: boolean
  blockedAt: string | null
  blockReason: string | null
  warnedAt: string | null
  createdAt: string
  _count: {
    garages: number
    cars: number
    carPhotos: number
    activities: number
    activityComments: number
    adminWarningsReceived: number
  }
}

interface WarningRecord {
  id: string
  reason: string
  message: string
  createdAt: string
  user: { id: string; username: string; email: string; avatar: string | null; blockedAt: string | null }
  admin: { id: string; username: string }
}

interface PhotoRecord {
  id: string
  imageUrl: string
  caption: string | null
  createdAt: string
  user: { id: string; username: string; email: string; avatar: string | null; blockedAt: string | null }
  car: { id: string; carName: string; carModel: string | null }
}

interface SocData {
  metrics: {
    totalUsers: number
    blockedUsers: number
    unverifiedUsers: number
    totalPhotos: number
    recentWarnings: number
    recentActivities: number
    commentCount: number
    friendRequestCount: number
    requests24h: number
    blockedIpCount: number
    rateLimited24h: number
  }
  recentPhotos: Array<{
    id: string
    imageUrl: string
    caption: string | null
    createdAt: string
    user: { id: string; username: string; avatar: string | null; blockedAt: string | null }
    car: { id: string; carName: string }
  }>
}

interface TrafficData {
  metrics: {
    totalRequests24h: number
    blockedIpCount: number
    rateLimited24h: number
  }
  ipControls: Array<{
    ipAddress: string
    requestCount: number
    scanCount: number
    blocked: boolean
    blockReason: string | null
    firstSeenAt: string
    lastSeenAt: string
    blockedAt: string | null
    logs: Array<{
      id: string
      method: string
      path: string
      status: number | null
      reason: string | null
      createdAt: string
      userAgent: string | null
    }>
  }>
  recentLogs: Array<{
    id: string
    ipAddress: string
    method: string
    path: string
    status: number | null
    reason: string | null
    createdAt: string
    userAgent: string | null
  }>
}

const tabs = [
  { id: 'players' as const, label: 'Players', icon: Users },
  { id: 'warnings' as const, label: 'Warnings', icon: MessageSquareWarning },
  { id: 'photos' as const, label: 'Photos', icon: Camera },
  { id: 'traffic' as const, label: 'Traffic', icon: Globe2 },
  { id: 'soc' as const, label: 'SOC', icon: ShieldCheck },
]

const warningReasons = [
  { value: 'toxic_behavior', label: 'Toxic behavior' },
  { value: 'bad_photo', label: 'Bad photo upload' },
  { value: 'spam', label: 'Spam or abuse' },
  { value: 'other', label: 'Other safety issue' },
]

const warningTemplates: Record<string, string> = {
  toxic_behavior:
    'We noticed behavior that does not match GTA Garage crew standards. Please keep comments respectful and avoid harassing, insulting, or provoking other players. Continued violations may lead to restricted access.',
  bad_photo:
    'We reviewed one of your uploaded photos and it may not follow GTA Garage safety rules. Please only upload appropriate car-related images. Repeated unsafe uploads may lead to restricted access.',
  spam:
    'We noticed repeated or low-quality activity from your account. Please avoid spam and keep posts useful for the garage community. Continued violations may lead to restricted access.',
  other:
    'We noticed activity that may not follow GTA Garage safety rules. Please review your recent actions and keep the platform respectful, safe, and focused on garage content.',
}

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function reasonLabel(value: string) {
  return warningReasons.find((reason) => reason.value === value)?.label ?? value
}

export function AdminSafetyConsole() {
  const [activeTab, setActiveTab] = useState<Tab>('players')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [warnings, setWarnings] = useState<WarningRecord[]>([])
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [soc, setSoc] = useState<SocData | null>(null)
  const [traffic, setTraffic] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [adminLookup, setAdminLookup] = useState('')
  const [warningReason, setWarningReason] = useState('toxic_behavior')
  const [warningMessage, setWarningMessage] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [ipBlockReason, setIpBlockReason] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  function selectUser(user: AdminUser, reason = warningReason) {
    setSelectedUser(user)
    setWarningReason(reason)
    if (!warningMessage.trim()) {
      setWarningMessage(warningTemplates[reason])
    }
  }

  function updateWarningReason(reason: string) {
    setWarningReason(reason)
    setWarningMessage(warningTemplates[reason] ?? '')
  }

  async function loadAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (status !== 'all') params.set('status', status)

      const [usersRes, warningsRes, photosRes, socRes, trafficRes] = await Promise.all([
        fetch(`/api/admin/users?${params.toString()}`),
        fetch('/api/admin/warnings'),
        fetch('/api/admin/photos'),
        fetch('/api/admin/soc'),
        fetch('/api/admin/traffic'),
      ])

      if (!usersRes.ok || !warningsRes.ok || !photosRes.ok || !socRes.ok || !trafficRes.ok) {
        throw new Error('Could not load admin data')
      }

      const [usersData, warningsData, photosData, socData, trafficData] = await Promise.all([
        usersRes.json(),
        warningsRes.json(),
        photosRes.json(),
        socRes.json(),
        trafficRes.json(),
      ])

      setUsers(usersData.users ?? [])
      setWarnings(warningsData.warnings ?? [])
      setPhotos(photosData.photos ?? [])
      setSoc(socData)
      setTraffic(trafficData)
    } catch {
      setError('Admin data could not be loaded. Check your admin access and database connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function applyFilters(event: React.FormEvent) {
    event.preventDefault()
    await loadAll(true)
  }

  async function addAdmin(event: React.FormEvent) {
    event.preventDefault()
    if (adminLookup.trim().length < 3) {
      setError('Enter a username or email to promote.')
      return
    }

    setActionId('add-admin')
    setError('')
    setNotice('')

    const res = await fetch('/api/admin/users/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: adminLookup }),
    })
    const data = await res.json()

    setActionId(null)
    if (!res.ok) {
      setError(data.error ?? 'Could not add admin.')
      return
    }

    setAdminLookup('')
    setNotice(`${data.user.username} is now an admin.`)
    await loadAll(true)
  }

  async function updateRole(user: AdminUser, role: 'USER' | 'ADMIN') {
    setActionId(`role-${user.id}`)
    setError('')
    setNotice('')

    const res = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = await res.json()

    setActionId(null)
    if (!res.ok) {
      setError(data.error ?? 'Could not update admin role.')
      return
    }

    setNotice(
      role === 'ADMIN'
        ? `${data.user.username} is now an admin.`
        : `${data.user.username} is no longer an admin.`
    )
    await loadAll(true)
  }

  async function updateIpAccess(ipAddress: string, action: 'block' | 'unblock') {
    const reason = action === 'block' ? ipBlockReason.trim() : ''
    if (action === 'block' && reason.length < 5) {
      setError('IP block reason must be at least 5 characters.')
      return
    }

    setActionId(`ip-${ipAddress}`)
    setError('')
    setNotice('')

    const res = await fetch(`/api/admin/traffic/${encodeURIComponent(ipAddress)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'block' ? { action, reason } : { action }),
    })
    const data = await res.json()

    setActionId(null)
    if (!res.ok) {
      setError(data.error ?? 'Could not update IP access.')
      return
    }

    setIpBlockReason('')
    setNotice(
      action === 'block'
        ? `${data.ipControl.ipAddress} is now blocked.`
        : `${data.ipControl.ipAddress} is unblocked.`
    )
    await loadAll(true)
  }

  async function updateAccess(user: AdminUser, action: 'block' | 'unblock') {
    const reason = action === 'block' ? blockReason.trim() : ''
    if (action === 'block' && reason.length < 5) {
      setError('Block reason must be at least 5 characters.')
      return
    }

    setActionId(user.id)
    setError('')
    setNotice('')

    const res = await fetch(`/api/admin/users/${user.id}/access`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'block' ? { action, reason } : { action }),
    })
    const data = await res.json()

    setActionId(null)
    if (!res.ok) {
      setError(data.error ?? 'Could not update player access.')
      return
    }

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, blockedAt: data.user.blockedAt, blockReason: data.user.blockReason }
          : item
      )
    )
    setSelectedUser((current) =>
      current?.id === user.id
        ? { ...current, blockedAt: data.user.blockedAt, blockReason: data.user.blockReason }
        : current
    )
    setBlockReason('')
    setNotice(action === 'block' ? `${user.username} is now blocked.` : `${user.username} is unblocked.`)
    await loadAll(true)
  }

  async function sendWarning(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedUser) return
    if (warningMessage.trim().length < 10) {
      setError('Write at least 10 characters before sending a warning.')
      return
    }

    setActionId(selectedUser.id)
    setError('')
    setNotice('')

    const res = await fetch(`/api/admin/users/${selectedUser.id}/warnings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: warningReason, message: warningMessage }),
    })
    const data = await res.json()

    setActionId(null)
    if (!res.ok) {
      setError(data.error ?? 'Could not send warning.')
      return
    }

    setWarningMessage('')
    setNotice(`Warning sent to ${selectedUser.username}.`)
    await loadAll(true)
  }

  const selectedFresh = useMemo(
    () => users.find((user) => user.id === selectedUser?.id) ?? selectedUser,
    [selectedUser, users]
  )

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow mb-2">Super safety control</p>
          <h1 className="page-title">Admin SOC</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-garage-subtle">
            Monitor player accounts, review uploads, send warnings, and lock access when safety rules are broken.
          </p>
        </div>
        <button onClick={() => loadAll(true)} disabled={refreshing} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && <ErrorMessage message={error} />}
      {notice && (
        <div className="rounded-lg border border-garage-neon/25 bg-garage-neon/10 px-4 py-3 text-sm text-garage-neon">
          {notice}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-garage-border/70 bg-garage-surface/75 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-garage-neon/12 text-garage-neon'
                : 'text-garage-subtle hover:bg-garage-muted hover:text-garage-text'
            }`}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'players' && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <form onSubmit={addAdmin} className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
              <div>
                <label className="label" htmlFor="adminLookup">Add Admin</label>
                <input
                  id="adminLookup"
                  value={adminLookup}
                  onChange={(event) => setAdminLookup(event.target.value)}
                  className="input"
                  placeholder="Username or email"
                />
              </div>
              <button disabled={actionId === 'add-admin'} className="btn-primary self-end" type="submit">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Add Admin
              </button>
            </form>

            <form onSubmit={applyFilters} className="card flex flex-col gap-3 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-garage-subtle" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="input pl-10"
                  placeholder="Search username or email"
                />
              </div>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="input sm:w-44">
                <option value="all">All players</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="unverified">Unverified</option>
              </select>
              <button className="btn-primary" type="submit">Apply</button>
            </form>

            {users.length === 0 ? (
              <EmptyState icon={<Users className="h-7 w-7" aria-hidden="true" />} title="No players found" description="Adjust the search or status filter." />
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className={`card w-full p-4 text-left transition-colors hover:border-garage-neon-blue/40 ${
                      selectedFresh?.id === user.id ? 'border-garage-neon-blue/50 bg-garage-panel' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={user.avatar} username={user.username} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-garage-text">{user.username}</p>
                          {user.role === 'ADMIN' && <span className="badge-blue">Admin</span>}
                          {user.blockedAt ? <span className="badge bg-red-500/10 text-red-700 border border-red-300/60">Blocked</span> : <span className="badge-neon">Active</span>}
                          {!user.emailVerified && <span className="badge-amber">Unverified</span>}
                        </div>
                        <p className="mt-1 truncate text-xs text-garage-subtle">{user.email}</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-garage-subtle">
                          <span>{user._count.garages} garages</span>
                          <span>{user._count.cars} cars</span>
                          <span>{user._count.carPhotos} photos</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="card h-fit p-5">
            {selectedFresh ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Avatar src={selectedFresh.avatar} username={selectedFresh.username} size={48} />
                  <div className="min-w-0">
                    <h2 className="section-title truncate">{selectedFresh.username}</h2>
                    <p className="truncate text-xs text-garage-subtle">{selectedFresh.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-garage-border bg-garage-muted/50 p-3">
                    <p className="text-garage-subtle">Warnings</p>
                    <p className="mt-1 text-lg font-semibold text-garage-text">{selectedFresh._count.adminWarningsReceived}</p>
                  </div>
                  <div className="rounded-lg border border-garage-border bg-garage-muted/50 p-3">
                    <p className="text-garage-subtle">Comments</p>
                    <p className="mt-1 text-lg font-semibold text-garage-text">{selectedFresh._count.activityComments}</p>
                  </div>
                </div>

                {selectedFresh.blockedAt ? (
                  <div className="rounded-lg border border-red-300/60 bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-medium">Blocked {formatDate(selectedFresh.blockedAt)}</p>
                    <p className="mt-1 text-xs leading-5 text-red-700/80">{selectedFresh.blockReason}</p>
                  </div>
                ) : (
                  <textarea
                    value={blockReason}
                    onChange={(event) => setBlockReason(event.target.value)}
                    className="input min-h-24 resize-none"
                    placeholder="Reason for blocking this player"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => updateRole(selectedFresh, selectedFresh.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                    disabled={actionId === `role-${selectedFresh.id}`}
                    className="btn-secondary flex-1"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    {selectedFresh.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  {selectedFresh.blockedAt ? (
                    <button
                      onClick={() => updateAccess(selectedFresh, 'unblock')}
                      disabled={actionId === selectedFresh.id}
                      className="btn-primary flex-1"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => updateAccess(selectedFresh, 'block')}
                      disabled={actionId === selectedFresh.id}
                      className="btn-danger flex-1"
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                      Block
                    </button>
                  )}
                </div>

                <form onSubmit={sendWarning} className="space-y-3 border-t border-garage-border pt-5">
                  <h3 className="font-semibold text-garage-text">Send Warning</h3>
                  <select value={warningReason} onChange={(event) => updateWarningReason(event.target.value)} className="input">
                    {warningReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                  <textarea
                    value={warningMessage}
                    onChange={(event) => setWarningMessage(event.target.value)}
                    className="input min-h-28 resize-none"
                    placeholder="Write a clear safety warning for this player"
                  />
                  <p className="text-xs leading-5 text-garage-subtle">
                    This warning can be sent even when the player is already blocked, so the moderation record stays complete.
                  </p>
                  <button disabled={actionId === selectedFresh.id} className="btn-secondary w-full">
                    <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
                    Send Warning
                  </button>
                </form>
              </div>
            ) : (
              <EmptyState icon={<ShieldCheck className="h-7 w-7" aria-hidden="true" />} title="Select a player" description="Choose a player to review access, warning history, and safety actions." />
            )}
          </aside>
        </section>
      )}

      {activeTab === 'warnings' && (
        <section className="space-y-3">
          {warnings.length === 0 ? (
            <EmptyState icon={<MessageSquareWarning className="h-7 w-7" aria-hidden="true" />} title="No warnings yet" description="Player warning history will appear here." />
          ) : warnings.map((warning) => (
            <div key={warning.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <Avatar src={warning.user.avatar} username={warning.user.username} size={40} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-garage-text">{warning.user.username}</p>
                      <span className="badge-amber">{reasonLabel(warning.reason)}</span>
                      {warning.user.blockedAt && <span className="badge bg-red-500/10 text-red-700 border border-red-300/60">Blocked</span>}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-garage-subtle">{warning.message}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xs text-garage-subtle">{formatDate(warning.createdAt)} by {warning.admin.username}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'photos' && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState icon={<Camera className="h-7 w-7" aria-hidden="true" />} title="No photos uploaded" description="Recent player photo uploads will appear here." />
            </div>
          ) : photos.map((photo) => (
            <article key={photo.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] w-full bg-garage-muted">
                <Image src={photo.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" unoptimized />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <Avatar src={photo.user.avatar} username={photo.user.username} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-garage-text">{photo.user.username}</p>
                    <p className="truncate text-xs text-garage-subtle">{photo.car.carName}{photo.car.carModel ? ` - ${photo.car.carModel}` : ''}</p>
                  </div>
                  {photo.user.blockedAt && <span className="badge bg-red-500/10 text-red-700 border border-red-300/60">Blocked</span>}
                </div>
                {photo.caption && <p className="text-sm leading-6 text-garage-subtle">{photo.caption}</p>}
                <button
                  onClick={() => {
                    const user = users.find((item) => item.id === photo.user.id)
                    if (user) {
                      selectUser(user, 'bad_photo')
                      setActiveTab('players')
                    }
                  }}
                  className="btn-secondary w-full"
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Review Player
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'traffic' && traffic && (
        <section className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['Requests 24h', traffic.metrics.totalRequests24h],
              ['Blocked IPs', traffic.metrics.blockedIpCount],
              ['Rate Limited 24h', traffic.metrics.rateLimited24h],
            ].map(([label, value]) => (
              <div key={label} className="card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-garage-subtle">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-garage-text">{value}</p>
              </div>
            ))}
          </div>

          <div className="card p-4">
            <label className="label" htmlFor="ipBlockReason">IP Block Reason</label>
            <input
              id="ipBlockReason"
              value={ipBlockReason}
              onChange={(event) => setIpBlockReason(event.target.value)}
              className="input"
              placeholder="Example: repeated login spam or suspicious endpoint scanning"
            />
          </div>

          {traffic.ipControls.length === 0 ? (
            <EmptyState icon={<Globe2 className="h-7 w-7" aria-hidden="true" />} title="No traffic recorded" description="API endpoint access will appear here after requests are made." />
          ) : (
            <div className="space-y-3">
              {traffic.ipControls.map((ip) => (
                <article key={ip.ipAddress} className="card p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Globe2 className="h-4 w-4 text-garage-neon-blue" aria-hidden="true" />
                        <h2 className="break-all font-semibold text-garage-text">{ip.ipAddress}</h2>
                        {ip.blocked ? (
                          <span className="badge bg-red-500/10 text-red-700 border border-red-300/60">Blocked</span>
                        ) : (
                          <span className="badge-neon">Allowed</span>
                        )}
                        {ip.scanCount > 0 && <span className="badge-amber">{ip.scanCount} scan hits</span>}
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-garage-subtle sm:grid-cols-3">
                        <span>Window requests: {ip.requestCount}</span>
                        <span>First access: {formatDate(ip.firstSeenAt)}</span>
                        <span>Last access: {formatDate(ip.lastSeenAt)}</span>
                      </div>
                      {ip.blockReason && (
                        <p className="mt-3 rounded-lg border border-red-300/50 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                          {ip.blockReason}
                        </p>
                      )}
                      <div className="mt-4 space-y-2">
                        {ip.logs.map((log) => (
                          <div key={log.id} className="rounded-lg border border-garage-border bg-garage-muted/45 px-3 py-2">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="break-all text-xs font-medium text-garage-text">
                                {log.method} {log.path}
                              </p>
                              <span className="text-xs text-garage-subtle">{formatDate(log.createdAt)}</span>
                            </div>
                            <p className="mt-1 text-xs text-garage-subtle">
                              Status {log.status ?? 'pending'}{log.reason ? ` - ${log.reason}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {ip.blocked ? (
                        <button
                          onClick={() => updateIpAccess(ip.ipAddress, 'unblock')}
                          disabled={actionId === `ip-${ip.ipAddress}`}
                          className="btn-primary"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Unblock IP
                        </button>
                      ) : (
                        <button
                          onClick={() => updateIpAccess(ip.ipAddress, 'block')}
                          disabled={actionId === `ip-${ip.ipAddress}`}
                          className="btn-danger"
                        >
                          <Ban className="h-4 w-4" aria-hidden="true" />
                          Block IP
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-garage-neon-amber" aria-hidden="true" />
              <h2 className="section-title">Recent Endpoint Access</h2>
            </div>
            <div className="space-y-2">
              {traffic.recentLogs.map((log) => (
                <div key={log.id} className="grid gap-2 rounded-lg border border-garage-border bg-garage-muted/45 p-3 text-xs md:grid-cols-[150px_1fr_150px]">
                  <span className="break-all font-medium text-garage-text">{log.ipAddress}</span>
                  <span className="break-all text-garage-subtle">{log.method} {log.path}</span>
                  <span className="text-garage-subtle">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'soc' && soc && (
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['Total Players', soc.metrics.totalUsers],
              ['Blocked', soc.metrics.blockedUsers],
              ['Unverified', soc.metrics.unverifiedUsers],
              ['Total Photos', soc.metrics.totalPhotos],
              ['Warnings 24h', soc.metrics.recentWarnings],
              ['Activities 24h', soc.metrics.recentActivities],
              ['Comments 24h', soc.metrics.commentCount],
              ['Requests 24h', soc.metrics.friendRequestCount],
              ['Endpoint Hits 24h', soc.metrics.requests24h],
              ['Blocked IPs', soc.metrics.blockedIpCount],
              ['Rate Limited 24h', soc.metrics.rateLimited24h],
            ].map(([label, value]) => (
              <div key={label} className="card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-garage-subtle">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-garage-text">{value}</p>
              </div>
            ))}
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-garage-neon" aria-hidden="true" />
              <h2 className="section-title">SOC Watch Queue</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {soc.recentPhotos.map((photo) => (
                <div key={photo.id} className="flex gap-3 rounded-lg border border-garage-border bg-garage-muted/45 p-3">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-garage-muted">
                    <Image src={photo.imageUrl} alt="" fill sizes="96px" className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-garage-text">{photo.car.carName}</p>
                    <p className="truncate text-xs text-garage-subtle">Uploaded by {photo.user.username}</p>
                    <p className="mt-2 text-xs text-garage-subtle">{formatDate(photo.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

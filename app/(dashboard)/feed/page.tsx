'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, CarFront, Heart, MessageCircle, Radio, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { PhotoCarousel } from '@/components/ui/PhotoCarousel'

interface FeedItem {
  activityId: string
  userId: string
  username: string
  avatar: string | null
  activityType: string
  carName: string | null
  carId: string | null
  garageName: string | null
  garageId: string | null
  imageUrl: string | null
  caption: string | null
  createdAt: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

interface FeedPost {
  id: string
  userId: string
  username: string
  avatar: string | null
  garageId: string | null
  garageName: string
  latestAt: string
  primaryItem: FeedItem
  items: FeedItem[]
}

type CommentRecord = {
  id: string
  userId: string
  username: string
  avatar: string | null
  commentText: string
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function groupIntoPosts(items: FeedItem[]) {
  const map = new Map<string, FeedPost>()

  for (const item of items) {
    const key = `${item.userId}:${item.garageId ?? item.activityId}`
    const existing = map.get(key)

    if (existing) {
      existing.items.push(item)
      if (new Date(item.createdAt) > new Date(existing.latestAt)) {
        existing.latestAt = item.createdAt
        existing.primaryItem = item
      }
      continue
    }

    map.set(key, {
      id: key,
      userId: item.userId,
      username: item.username,
      avatar: item.avatar,
      garageId: item.garageId,
      garageName: item.garageName ?? 'Garage update',
      latestAt: item.createdAt,
      primaryItem: item,
      items: [item],
    })
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
  )
}

function postSummary(post: FeedPost) {
  const garages = post.items.filter((item) => item.activityType === 'GARAGE_CREATED').length
  const cars = post.items.filter((item) => item.activityType === 'CAR_ADDED').length
  const photos = post.items.filter((item) => item.activityType === 'PHOTO_UPLOADED').length
  const carNames = Array.from(new Set(post.items.map((item) => item.carName).filter(Boolean))).slice(0, 3)

  const parts = [
    garages ? `${garages} garage update${garages > 1 ? 's' : ''}` : '',
    cars ? `${cars} car${cars > 1 ? 's' : ''} added` : '',
    photos ? `${photos} photo${photos > 1 ? 's' : ''} uploaded` : '',
  ].filter(Boolean)

  const names = carNames.length ? `: ${carNames.join(', ')}` : ''
  return `${parts.join(', ') || 'New activity'} in ${post.garageName}${names}`
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, CommentRecord[]>>({})

  const posts = useMemo(() => groupIntoPosts(feed), [feed])

  useEffect(() => {
    let active = true

    async function loadFeed() {
      try {
        const res = await fetch('/api/feed')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Could not load feed')
        if (active) setFeed(data.feed ?? [])
      } catch {
        if (active) setError('Could not load crew feed. Please refresh and try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadFeed()
    return () => {
      active = false
    }
  }, [])

  async function toggleLike(item: FeedItem) {
    const method = item.likedByMe ? 'DELETE' : 'POST'
    await fetch(`/api/feed/${item.activityId}/like`, { method })
    setFeed((prev) =>
      prev.map((f) =>
        f.activityId === item.activityId
          ? { ...f, likedByMe: !f.likedByMe, likeCount: f.likeCount + (f.likedByMe ? -1 : 1) }
          : f
      )
    )
  }

  async function loadComments(activityId: string) {
    if (comments[activityId]) return
    const res = await fetch(`/api/feed/${activityId}/comments`)
    const data = await res.json()
    setComments((prev) => ({ ...prev, [activityId]: data.comments ?? [] }))
  }

  async function toggleComments(activityId: string) {
    const open = !commentOpen[activityId]
    setCommentOpen((prev) => ({ ...prev, [activityId]: open }))
    if (open) await loadComments(activityId)
  }

  async function submitComment(activityId: string) {
    const text = commentInputs[activityId]?.trim()
    if (!text) return
    const res = await fetch(`/api/feed/${activityId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentText: text }),
    })
    const data = await res.json()
    if (res.ok) {
      setComments((prev) => ({
        ...prev,
        [activityId]: [...(prev[activityId] ?? []), data.comment],
      }))
      setCommentInputs((prev) => ({ ...prev, [activityId]: '' }))
      setFeed((prev) =>
        prev.map((f) => (f.activityId === activityId ? { ...f, commentCount: f.commentCount + 1 } : f))
      )
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow mb-2">Crew signal</p>
          <h1 className="page-title">Crew Feed</h1>
          <p className="mt-2 text-sm text-garage-subtle">Garage posts from your crew, grouped cleanly like a social gallery.</p>
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Radio className="h-7 w-7" aria-hidden="true" />}
          title="Nothing here yet"
          description="Add friends to see their garage posts here."
          action={<Link href="/friends" className="btn-primary">Find Friends</Link>}
        />
      ) : (
        <div className="mx-auto max-w-[470px] space-y-6">
          {posts.map((post) => {
            const primary = post.primaryItem
            const photos = post.items
              .filter((item) => item.imageUrl)
              .map((item) => ({
                src: item.imageUrl as string,
                alt: item.caption ?? item.carName ?? post.garageName,
                caption: item.caption,
                href: item.carId ? `/cars/${item.carId}` : post.garageId ? `/garages/${post.garageId}` : undefined,
              }))
            const totalLikes = post.items.reduce((sum, item) => sum + item.likeCount, 0)
            const totalComments = post.items.reduce((sum, item) => sum + item.commentCount, 0)
            const garageHref = post.garageId ? `/garages/${post.garageId}` : '/feed'

            return (
              <article key={post.id} className="overflow-hidden border-b border-garage-border pb-6">
                <header className="mb-3 flex items-center gap-3">
                  <Link href={`/users/${post.userId}`} className="shrink-0">
                    <Avatar src={post.avatar} username={post.username} size={40} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/users/${post.userId}`} className="truncate text-sm font-semibold text-garage-text hover:text-garage-neon">
                        {post.username}
                      </Link>
                      <span className="text-xs text-garage-subtle">- {timeAgo(post.latestAt)}</span>
                    </div>
                    <Link href={garageHref} className="truncate text-xs font-medium text-garage-subtle hover:text-garage-neon">
                      {post.garageName}
                    </Link>
                  </div>
                  <Link href={garageHref} className="rounded-md px-2 py-1 text-xs font-semibold text-garage-neon-blue hover:bg-garage-neon-blue/10">
                    Garage
                  </Link>
                </header>

                <div className="overflow-hidden rounded-lg border border-garage-border bg-garage-surface shadow-card">
                  <PhotoCarousel
                    photos={photos}
                    aspect="aspect-square"
                    fallback={<Building2 className="h-12 w-12 text-garage-subtle/60" aria-hidden="true" />}
                    priority={post === posts[0]}
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(primary)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                      primary.likedByMe ? 'text-garage-neon' : 'text-garage-text hover:bg-garage-muted'
                    }`}
                    aria-label="Like post"
                  >
                    <Heart className={`h-6 w-6 ${primary.likedByMe ? 'fill-current' : ''}`} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => toggleComments(primary.activityId)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-garage-text transition-colors hover:bg-garage-muted"
                    aria-label="View comments"
                  >
                    <MessageCircle className="h-6 w-6" aria-hidden="true" />
                  </button>
                  {primary.carId && (
                    <Link
                      href={`/cars/${primary.carId}`}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-garage-subtle transition-colors hover:bg-garage-muted hover:text-garage-neon"
                    >
                      <CarFront className="h-3.5 w-3.5" aria-hidden="true" />
                      View car
                    </Link>
                  )}
                </div>

                <p className="mt-1 text-sm font-semibold text-garage-text">
                  {totalLikes} likes
                  {totalComments > 0 ? ` - ${totalComments} comments` : ''}
                </p>
                <p className="mt-1 text-sm leading-6 text-garage-text">
                  <span className="font-semibold">{post.username}</span>{' '}
                  <span className="text-garage-subtle">{postSummary(post)}</span>
                </p>

                {commentOpen[primary.activityId] && (
                  <div className="mt-3 space-y-3">
                    {(comments[primary.activityId] ?? []).map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar src={comment.avatar} username={comment.username} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-garage-text">
                            <span className="font-semibold">{comment.username}</span>{' '}
                            <span className="text-garage-subtle">{comment.commentText}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        className="input flex-1 py-2 text-sm"
                        placeholder="Add a comment..."
                        value={commentInputs[primary.activityId] ?? ''}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [primary.activityId]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && submitComment(primary.activityId)}
                      />
                      <button onClick={() => submitComment(primary.activityId)} className="btn-primary px-3 py-2 text-sm" aria-label="Send comment">
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

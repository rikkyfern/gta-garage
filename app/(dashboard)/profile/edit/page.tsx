'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Camera, Save } from 'lucide-react'
import { ErrorMessage, SuccessMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner'

export default function EditProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', bio: '' })
  const [avatar, setAvatar] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profile/me')
      .then((r) => r.json())
      .then((d) => {
        setForm({ username: d.user.username, bio: d.user.bio ?? '' })
        setAvatar(d.user.avatar)
        setFetching(false)
      })
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const formData = new FormData()
    formData.append('username', form.username)
    formData.append('bio', form.bio)
    if (fileRef.current?.files?.[0]) {
      formData.append('avatar', fileRef.current.files[0])
    }

    const res = await fetch('/api/profile/me', { method: 'PATCH', body: formData })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Update failed')
      return
    }

    setSuccess('Profile updated!')
    setAvatar(data.user.avatar)
    setPreview(null)
    router.refresh()
  }

  if (fetching) return <PageLoader />

  const displayAvatar = preview ?? avatar

  return (
    <div className="max-w-xl">
      <div className="page-header">
        <div>
        <Link href="/profile" className="muted-link mb-3 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Profile
        </Link>
        <p className="eyebrow mb-2">Player settings</p>
        <h1 className="page-title">Edit Profile</h1>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-garage-muted border border-garage-border overflow-hidden relative">
              {displayAvatar ? (
                <Image src={displayAvatar} alt="Avatar" fill sizes="80px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-garage-neon">
                  {form.username.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Change Avatar
            </button>
          </div>

          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Tell the crew about yourself…"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={300}
            />
            <p className="text-xs text-garage-subtle mt-1 text-right">{form.bio.length}/300</p>
          </div>

          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Save Changes
            </button>
            <Link href="/profile" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

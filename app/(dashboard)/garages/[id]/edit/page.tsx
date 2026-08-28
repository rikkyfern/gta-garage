'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner'

export default function EditGaragePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState({ garageName: '', location: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  function formError(data: { error?: string; details?: Record<string, string[]> }) {
    const firstDetail = data.details ? Object.values(data.details).flat()[0] : undefined
    return firstDetail ?? data.error ?? 'Failed to update'
  }

  useEffect(() => {
    fetch(`/api/garages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          garageName: data.garage.garageName,
          location: data.garage.location ?? '',
          description: data.garage.description ?? '',
        })
        setFetching(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/garages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(formError(data))
      return
    }

    router.push(`/garages/${id}`)
  }

  if (fetching) return <PageLoader />

  return (
    <div className="max-w-xl">
      <div className="page-header">
        <div>
        <Link href={`/garages/${id}`} className="muted-link mb-3 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <p className="eyebrow mb-2">Garage settings</p>
        <h1 className="page-title">Edit Garage</h1>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm leading-6 text-garage-subtle">Keep the garage name, location, and notes useful for your crew.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Garage Name *</label>
            <input
              className="input"
              value={form.garageName}
              onChange={(e) => setForm({ ...form, garageName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Save Changes
            </button>
            <Link href={`/garages/${id}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

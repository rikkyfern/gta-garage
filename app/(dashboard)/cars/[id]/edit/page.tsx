'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CarFront, Save } from 'lucide-react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner'

export default function EditCarPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState({ carName: '', carModel: '', description: '', location: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  function formError(data: { error?: string; details?: Record<string, string[]> }) {
    const firstDetail = data.details ? Object.values(data.details).flat()[0] : undefined
    return firstDetail ?? data.error ?? 'Failed to update'
  }

  useEffect(() => {
    fetch(`/api/cars/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          carName: data.car.carName,
          carModel: data.car.carModel ?? '',
          description: data.car.description ?? '',
          location: data.car.location ?? '',
        })
        setFetching(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/cars/${id}`, {
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

    router.push(`/cars/${id}`)
  }

  if (fetching) return <PageLoader />

  return (
    <div className="max-w-xl">
      <div className="page-header">
        <div>
        <Link href={`/cars/${id}`} className="muted-link mb-3 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <p className="eyebrow mb-2">Vehicle settings</p>
        <h1 className="page-title">Edit Car</h1>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
            <CarFront className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm leading-6 text-garage-subtle">Refine the car profile so it reads cleanly in your garage and feed.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Car Name *</label>
            <input className="input" value={form.carName} onChange={(e) => setForm({ ...form, carName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Model</label>
            <input className="input" value={form.carModel} onChange={(e) => setForm({ ...form, carModel: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Save Changes
            </button>
            <Link href={`/cars/${id}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

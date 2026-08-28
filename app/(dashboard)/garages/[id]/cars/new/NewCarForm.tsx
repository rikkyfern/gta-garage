'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CarFront, Save } from 'lucide-react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type NewCarFormProps = {
  garageId: string
  garageName: string
}

export function NewCarForm({ garageId, garageName }: NewCarFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({ carName: '', carModel: '', description: '', location: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function formError(data: { error?: string; details?: Record<string, string[]> }) {
    const firstDetail = data.details ? Object.values(data.details).flat()[0] : undefined
    return firstDetail ?? data.error ?? 'Failed to add car'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/garages/${garageId}/cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(formError(data))
      return
    }

    router.push(`/cars/${data.car.id}`)
  }

  return (
    <div className="max-w-xl">
      <div className="page-header">
        <div>
          <Link href={`/garages/${garageId}`} className="muted-link mb-3 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Garage
          </Link>
          <p className="eyebrow mb-2">New vehicle</p>
          <h1 className="page-title">Add Car</h1>
          <p className="mt-2 text-sm text-garage-subtle">Adding to {garageName}</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
            <CarFront className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm leading-6 text-garage-subtle">Add the core details now, then upload photos from the car page.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Car Name *</label>
            <input
              className="input"
              placeholder="e.g. Bravado Buffalo S"
              value={form.carName}
              onChange={(e) => setForm({ ...form, carName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Model</label>
            <input
              className="input"
              placeholder="e.g. Buffalo S"
              value={form.carModel}
              onChange={(e) => setForm({ ...form, carModel: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              placeholder="e.g. Strawberry, LS"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Mods, specs, or anything interesting..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Add Car
            </button>
            <Link href={`/garages/${garageId}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

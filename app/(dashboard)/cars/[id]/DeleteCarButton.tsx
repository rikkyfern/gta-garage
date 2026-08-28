'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X } from 'lucide-react'

export function DeleteCarButton({ carId, garageId }: { carId: string; garageId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/cars/${carId}`, { method: 'DELETE' })
    router.push(`/garages/${garageId}`)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap gap-2">
        <button onClick={handleDelete} disabled={loading} className="btn-danger text-sm">
          {loading ? '…' : 'Confirm'}
        </button>
        <button onClick={() => setConfirming(false)} className="btn-secondary text-sm">
          <X className="h-4 w-4" aria-hidden="true" />
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn-danger text-sm">
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      Delete
    </button>
  )
}

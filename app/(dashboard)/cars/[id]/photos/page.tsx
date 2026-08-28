'use client'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Camera, ImagePlus, Trash2 } from 'lucide-react'
import { ErrorMessage, SuccessMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner'

interface Photo {
  id: string
  imageUrl: string
  caption?: string | null
}

interface CarData {
  id: string
  carName: string
  garage: { id: string }
}

export default function CarPhotosPage() {
  const { id: carId } = useParams<{ id: string }>()
  const [car, setCar] = useState<CarData | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [carRes, photoRes] = await Promise.all([
        fetch(`/api/cars/${carId}`, { credentials: 'same-origin' }),
        fetch(`/api/cars/${carId}/photos`, { credentials: 'same-origin' }),
      ])
      const carData = await carRes.json().catch(() => ({}))
      const photoData = await photoRes.json().catch(() => ({}))

      if (carRes.status === 401 || photoRes.status === 401) {
        setError('Your session expired. Please sign in again.')
        return
      }

      if (!carRes.ok) {
        setError(carData.error ?? 'Could not load this car.')
        return
      }

      if (!photoRes.ok) {
        setError(photoData.error ?? 'Could not load photos.')
        return
      }

      setCar(carData.car)
      setPhotos(Array.isArray(photoData.photos) ? photoData.photos : [])
    } catch {
      setError('Could not load photos. Check the app server and try again.')
    } finally {
      setFetching(false)
    }
  }, [carId])

  useEffect(() => { loadData() }, [loadData])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]

    setError('')
    setSuccess('')

    if (!file) {
      setError('Choose a photo before uploading.')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('File must be jpg, png, or webp.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }

    setUploading(true)

    const form = new FormData()
    form.append('photo', file)
    if (caption) form.append('caption', caption)

    try {
      const res = await fetch(`/api/cars/${carId}/photos`, {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        return
      }

      setSuccess('Photo uploaded!')
      setCaption('')
      if (fileRef.current) fileRef.current.value = ''
      await loadData()
    } catch {
      setError('Upload failed. Check the app server and try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photoId: string) {
    setError('')
    setDeletingId(photoId)
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'Delete failed')
        return
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } catch {
      setError('Delete failed. Check the app server and try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (fetching) return <PageLoader />

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <div>
        <Link href={`/cars/${carId}`} className="muted-link mb-3 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {car?.carName}
        </Link>
        <p className="eyebrow mb-2">Photo manager</p>
        <h1 className="page-title">Photos ({photos.length}/5)</h1>
        </div>
      </div>

      {photos.length < 5 ? (
        <div className="card p-6 mb-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="section-title">Upload Photo</h2>
          </div>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label htmlFor="photo" className="label">Photo *</label>
              <input
                id="photo"
                name="photo"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="input py-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-garage-neon/20 file:text-garage-neon file:text-sm file:cursor-pointer"
                required
              />
              <p className="text-xs text-garage-subtle mt-1">jpg, png, webp · max 10MB</p>
            </div>
            <div>
              <label htmlFor="caption" className="label">Caption (optional)</label>
              <input
                id="caption"
                name="caption"
                className="input"
                placeholder="Add a caption…"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={300}
              />
            </div>

            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}

            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={uploading}
              aria-busy={uploading}
            >
              {uploading ? <LoadingSpinner size="sm" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
              Upload Photo
            </button>
          </form>
        </div>
      ) : (
        <div className="card p-4 mb-6 text-center text-garage-subtle text-sm">
          Maximum 5 photos reached.
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="card overflow-hidden group relative">
              <div className="aspect-video relative">
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption ?? 'Car photo'}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {photo.caption && (
                <p className="text-xs text-garage-subtle p-2 truncate">{photo.caption}</p>
              )}
              <button
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 transition-colors hover:bg-red-600 group-hover:opacity-100"
                aria-label="Delete photo"
              >
                {deletingId === photo.id ? '…' : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Camera, CarFront, Pencil, Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewUserContent } from '@/lib/feed-visibility'
import { DeleteCarButton } from './DeleteCarButton'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const car = await prisma.car.findUnique({ where: { id } })
  return { title: car?.carName ?? 'Car' }
}

export default async function CarDetailPage({ params }: Params) {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const { id } = await params
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      garage: { select: { id: true, garageName: true } },
      user: { select: { id: true, username: true, avatar: true } },
      photos: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!car) notFound()

  const isOwner = car.userId === session.userId
  const canView = await canViewUserContent(car.userId, session.userId)

  if (!canView) notFound()

  const createdAt = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(car.createdAt)

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href={`/garages/${car.garage.id}`} className="muted-link mb-3 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {car.garage.garageName}
          </Link>
          <p className="eyebrow mb-2">Vehicle profile</p>
          <h1 className="page-title">{car.carName}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-garage-subtle">
            Complete vehicle information for this garage build.
          </p>
        </div>
        {isOwner && (
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Link href={`/cars/${id}/edit`} className="btn-secondary text-sm">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
            <Link href={`/cars/${id}/photos`} className="btn-primary text-sm">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Photos
            </Link>
            <DeleteCarButton carId={id} garageId={car.garage.id} />
          </div>
        )}
      </div>

      <section className="panel mb-6 overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
                <CarFront className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-garage-subtle">Car Name</p>
                <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight text-garage-text">
                  {car.carName}
                </h2>
              </div>
            </div>

            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Model</dt>
                <dd className="mt-1 break-words text-sm font-medium text-garage-text">
                  {car.carModel ?? 'Not provided yet'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Location</dt>
                <dd className="mt-1 break-words text-sm font-medium text-garage-text">
                  {car.location ?? 'Not provided yet'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Garage</dt>
                <dd className="mt-1 break-words text-sm font-medium text-garage-text">
                  {car.garage.garageName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Owner</dt>
                <dd className="mt-1 break-words text-sm font-medium text-garage-text">
                  {isOwner ? 'You' : car.user.username}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Description</dt>
                <dd className="mt-1 max-w-3xl break-words text-sm leading-6 text-garage-text">
                  {car.description ?? 'No description added yet'}
                </dd>
              </div>
            </dl>
          </div>

          <aside className="border-t border-garage-border bg-garage-muted/35 p-5 lg:border-l lg:border-t-0">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Photos</dt>
                <dd className="mt-1 text-3xl font-semibold text-garage-text">{car.photos.length}/5</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Created</dt>
                <dd className="mt-1 text-sm font-medium text-garage-text">{createdAt}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">Gallery</p>
          <h2 className="section-title">Photos ({car.photos.length}/5)</h2>
        </div>
        {isOwner && car.photos.length < 5 && (
          <Link href={`/cars/${id}/photos`} className="btn-secondary px-3 py-2 text-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Photo
          </Link>
        )}
      </div>

      {car.photos.length === 0 ? (
        <div className="panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
            <Camera className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-sm text-garage-subtle">No photos yet.</p>
          {isOwner && <Link href={`/cars/${id}/photos`} className="btn-primary mt-5">Upload Photos</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {car.photos.map((photo) => (
            <div key={photo.id} className="card overflow-hidden aspect-video relative group">
              <Image
                src={photo.imageUrl}
                alt={photo.caption ?? car.carName}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

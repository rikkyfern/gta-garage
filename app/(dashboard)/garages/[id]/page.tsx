import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Building2, CarFront, Pencil, Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewUserContent } from '@/lib/feed-visibility'
import { EmptyState } from '@/components/ui/EmptyState'
import { PhotoCarousel } from '@/components/ui/PhotoCarousel'
import { DeleteGarageButton } from './DeleteGarageButton'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const garage = await prisma.garage.findUnique({ where: { id } })
  return { title: garage?.garageName ?? 'Garage' }
}

export default async function GarageDetailPage({ params }: Params) {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const { id } = await params
  const garage = await prisma.garage.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      cars: {
        include: { photos: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { cars: true } },
    },
  })

  if (!garage) notFound()

  const isOwner = garage.userId === session.userId
  const canView = await canViewUserContent(garage.userId, session.userId)

  if (!canView) notFound()

  const createdAt = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(garage.createdAt)
  const photos = garage.cars.flatMap((car) =>
    car.photos.map((photo) => ({
      src: photo.imageUrl,
      alt: photo.caption ?? car.carName,
      caption: photo.caption ?? car.carName,
      href: `/cars/${car.id}`,
    }))
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href={isOwner ? '/garages' : '/feed'} className="muted-link mb-3 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {isOwner ? 'My Garages' : 'Crew Feed'}
          </Link>
          <p className="eyebrow mb-2">Garage detail</p>
          <h1 className="page-title">{garage.garageName}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-garage-subtle">
            Complete garage information for this collection space.
          </p>
        </div>
        {isOwner && (
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <Link href={`/garages/${id}/edit`} className="btn-secondary text-sm">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
            <DeleteGarageButton garageId={id} />
          </div>
        )}
      </div>

      <section className="panel mb-6 overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-garage-subtle">Garage Name</p>
                <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight text-garage-text">
                  {garage.garageName}
                </h2>
              </div>
            </div>

            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Location</dt>
                <dd className="mt-1 break-words text-sm font-medium text-garage-text">
                  {garage.location ?? 'Not provided yet'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Owner</dt>
                <dd className="mt-1 break-words text-sm font-medium text-garage-text">
                  {isOwner ? 'You' : garage.user.username}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Description</dt>
                <dd className="mt-1 max-w-3xl break-words text-sm leading-6 text-garage-text">
                  {garage.description ?? 'No description added yet'}
                </dd>
              </div>
            </dl>
          </div>

          <aside className="border-t border-garage-border bg-garage-muted/35 lg:border-l lg:border-t-0">
            <PhotoCarousel
              photos={photos}
              aspect="aspect-square"
              fallback={<Building2 className="h-12 w-12 text-garage-subtle/60" aria-hidden="true" />}
              priority
            />
            <div className="p-5">
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Cars Stored</dt>
                <dd className="mt-1 text-3xl font-semibold text-garage-text">{garage._count.cars}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Created</dt>
                <dd className="mt-1 text-sm font-medium text-garage-text">{createdAt}</dd>
              </div>
            </dl>
            </div>
          </aside>
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">Inventory</p>
          <h2 className="section-title">Cars ({garage._count.cars})</h2>
        </div>
        {isOwner && (
          <Link href={`/garages/${id}/cars/new`} className="btn-primary text-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Car
          </Link>
        )}
      </div>

      {garage.cars.length === 0 ? (
        <EmptyState
          icon={<CarFront className="h-7 w-7" aria-hidden="true" />}
          title="No cars yet"
          description={isOwner ? 'Add your first car to this garage.' : 'This player has not added cars to this garage yet.'}
          action={isOwner ? <Link href={`/garages/${id}/cars/new`} className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" />Add Car</Link> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {garage.cars.map((car) => {
            const photo = car.photos[0]
            return (
              <Link key={car.id} href={`/cars/${car.id}`} className="interactive-card group overflow-hidden">
                <div className="relative aspect-video bg-garage-muted">
                  {photo ? (
                    <Image
                      src={photo.imageUrl}
                      alt={car.carName}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-garage-subtle/45">
                      <CarFront className="h-12 w-12" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-garage-bg/75 to-transparent" />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Car Name</p>
                  <h3 className="mt-1 break-words text-lg font-semibold text-garage-text transition-colors group-hover:text-garage-neon">
                    {car.carName}
                  </h3>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-garage-subtle">Model</dt>
                      <dd className="mt-0.5 break-words text-garage-text">{car.carModel ?? 'Not provided yet'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-garage-subtle">Location</dt>
                      <dd className="mt-0.5 break-words text-garage-text">{car.location ?? 'Not provided yet'}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-garage-subtle">Description</dt>
                      <dd className="mt-0.5 line-clamp-2 break-words text-garage-text">{car.description ?? 'No description added yet'}</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Building2, CarFront, Grid3X3, Pencil, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Avatar } from '@/components/ui/Avatar'
import { TelegramConnectCard } from './TelegramConnectCard'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      garages: {
        orderBy: { createdAt: 'desc' },
        include: {
          cars: {
            include: { photos: { orderBy: { createdAt: 'desc' }, take: 1 } },
          },
          _count: { select: { cars: true } },
        },
      },
      _count: {
        select: { garages: true, cars: true, carPhotos: true, friendshipsA: true, friendshipsB: true },
      },
    },
  })

  if (!user) redirect('/login')

  const friendCount = user._count.friendshipsA + user._count.friendshipsB

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="grid gap-6 border-b border-garage-border pb-8 md:grid-cols-[150px_minmax(0,1fr)] md:items-center">
        <Avatar src={user.avatar} username={user.username} size={128} className="mx-auto md:mx-0" />

        <div className="min-w-0 space-y-5 text-center md:text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <h1 className="break-words text-3xl font-semibold tracking-tight text-garage-text">{user.username}</h1>
            <Link href="/profile/edit" className="btn-secondary mx-auto px-4 py-2 text-sm md:mx-0">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit Profile
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-3 rounded-lg border border-garage-border bg-garage-surface/80 p-3">
            <div className="text-center">
              <p className="text-xl font-semibold text-garage-text">{user._count.garages}</p>
              <p className="text-xs text-garage-subtle">garages</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-garage-text">{user._count.cars}</p>
              <p className="text-xs text-garage-subtle">cars</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-garage-text">{user._count.carPhotos}</p>
              <p className="text-xs text-garage-subtle">photos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-garage-text">{friendCount}</p>
              <p className="text-xs text-garage-subtle">crew</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-garage-text">{user.email}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-garage-subtle">
              {user.bio ?? 'No bio yet. Add a short profile note so crew members know your garage style.'}
            </p>
          </div>
        </div>
      </section>

      <TelegramConnectCard />

      <section>
        <div className="mb-4 flex items-center justify-center gap-2 border-b border-garage-border pb-3 text-sm font-semibold uppercase tracking-[0.16em] text-garage-text">
          <Grid3X3 className="h-4 w-4" aria-hidden="true" />
          Garages
        </div>

        {user.garages.length === 0 ? (
          <div className="panel p-10 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-garage-neon-blue" aria-hidden="true" />
            <p className="font-semibold text-garage-text">No garages yet</p>
            <p className="mt-1 text-sm text-garage-subtle">Create a garage and it will appear as a profile tile.</p>
            <Link href="/garages/new" className="btn-primary mt-5">Create Garage</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {user.garages.map((garage) => {
              const cover = garage.cars.flatMap((car) => car.photos)[0]
              return (
                <Link
                  key={garage.id}
                  href={`/garages/${garage.id}`}
                  className="group relative aspect-square overflow-hidden rounded-sm bg-garage-muted"
                >
                  {cover ? (
                    <Image
                      src={cover.imageUrl}
                      alt={garage.garageName}
                      fill
                      sizes="(min-width: 1024px) 320px, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-garage-subtle">
                      <Building2 className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-garage-bg/85 via-garage-bg/10 to-transparent opacity-90" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-white">{garage.garageName}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                      <CarFront className="h-3.5 w-3.5" aria-hidden="true" />
                      {garage._count.cars} cars
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

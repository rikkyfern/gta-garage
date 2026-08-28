import Link from 'next/link'
import { Building2, CarFront, MapPin, Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmptyState } from '@/components/ui/EmptyState'
import { redirect } from 'next/navigation'

export const metadata = { title: 'My Garages' }

export default async function GaragesPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const garages = await prisma.garage.findMany({
    where: { userId: session.userId },
    include: { _count: { select: { cars: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow mb-2">Collection spaces</p>
          <h1 className="page-title">My Garages</h1>
          <p className="mt-2 text-sm text-garage-subtle">Organize every build by location, theme, or crew role.</p>
        </div>
        <Link href="/garages/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Garage
        </Link>
      </div>

      {garages.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" aria-hidden="true" />}
          title="No garages yet"
          description="Create your first garage to start adding cars."
          action={<Link href="/garages/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden="true" />Create Garage</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {garages.map((g) => (
            <Link key={g.id} href={`/garages/${g.id}`} className="interactive-card group overflow-hidden p-5">
              <div className="grid gap-5 sm:grid-cols-[64px_minmax(0,1fr)_96px] sm:items-start">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
                  <Building2 className="h-7 w-7" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-garage-subtle">Garage Name</p>
                  <h3 className="mt-1 break-words text-xl font-semibold tracking-tight text-garage-text transition-colors group-hover:text-garage-neon">
                    {g.garageName}
                  </h3>

                  <dl className="mt-4 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-garage-subtle">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        Location
                      </dt>
                      <dd className="mt-0.5 break-words text-garage-text">{g.location ?? 'Not provided yet'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-garage-subtle">Created</dt>
                      <dd className="mt-0.5 text-garage-text">{new Date(g.createdAt).toLocaleDateString()}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-garage-subtle">Description</dt>
                      <dd className="mt-0.5 line-clamp-2 break-words text-garage-text">{g.description ?? 'No description added yet'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border border-garage-neon/20 bg-garage-neon/10 p-3 text-center text-garage-neon">
                  <CarFront className="mx-auto h-4 w-4" aria-hidden="true" />
                  <p className="mt-1 text-2xl font-semibold">{g._count.cars}</p>
                  <p className="text-xs font-medium">Cars</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

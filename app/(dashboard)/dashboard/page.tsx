import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, Building2, CarFront, Plus, Radio, Settings, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const [garageCount, carCount, friendCount, pendingCount] = await Promise.all([
    prisma.garage.count({ where: { userId: session.userId } }),
    prisma.car.count({ where: { userId: session.userId } }),
    prisma.friendship.count({
      where: { OR: [{ userAId: session.userId }, { userBId: session.userId }] },
    }),
    prisma.friendRequest.count({
      where: { receiverId: session.userId, status: 'PENDING' },
    }),
  ])

  const stats = [
    { label: 'Garages', value: garageCount, icon: Building2, href: '/garages' },
    { label: 'Cars', value: carCount, icon: CarFront, href: '/garages' },
    { label: 'Crew', value: friendCount, icon: Users, href: '/friends' },
    { label: 'Requests', value: pendingCount, icon: Bell, href: '/friends/requests', highlight: pendingCount > 0 },
  ]

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">Night shift overview</p>
            <h1 className="text-3xl font-semibold tracking-tight text-garage-text sm:text-4xl">
              Welcome back, {session.username}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-garage-subtle">
              Your garages, cars, and crew activity are lined up for a clean session.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/garages/new" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Garage
            </Link>
            <Link href="/feed" className="btn-secondary">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Crew Feed
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`interactive-card p-5 ${s.highlight ? 'border-garage-neon-amber/45 shadow-neon' : ''}`}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-garage-border bg-garage-muted/70 text-garage-neon-blue">
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className={`metric-value ${s.highlight ? 'text-garage-neon-amber' : ''}`}>{s.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-garage-subtle">{s.label}</div>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-2">Shortcuts</p>
            <h2 className="section-title">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/garages/new', icon: Plus, title: 'New Garage', desc: 'Create a fresh space for your collection' },
          { href: '/feed', icon: Radio, title: 'Crew Feed', desc: 'See the latest garage activity' },
          { href: '/friends', icon: Users, title: 'Find Crew', desc: 'Search players and build your circle' },
          { href: '/profile/edit', icon: Settings, title: 'Profile', desc: 'Update your avatar and bio' },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="interactive-card flex items-start gap-4 p-5 group">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
              <a.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium text-garage-text transition-colors group-hover:text-garage-neon">{a.title}</p>
              <p className="mt-1 text-xs leading-5 text-garage-subtle">{a.desc}</p>
            </div>
          </Link>
        ))}
        </div>
      </section>
    </div>
  )
}

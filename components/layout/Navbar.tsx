'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Building2, ChevronDown, Home, LogOut, Radio, ShieldCheck, Settings, User, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface NavbarProps {
  user: { id: string; username: string; avatar?: string | null; isAdmin?: boolean }
  pendingFriendRequests?: number
}

export function Navbar({ user, pendingFriendRequests = 0 }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/garages', label: 'Garages', icon: Building2 },
    { href: '/feed', label: 'Feed', icon: Radio },
    { href: '/friends', label: 'Crew', icon: Users, badge: pendingFriendRequests },
    ...(user.isAdmin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ]

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-garage-border/70 bg-garage-bg/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-3" aria-label="GTA Garage dashboard">
            <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover ring-1 ring-garage-border" priority unoptimized />
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold tracking-[0.18em] text-garage-neon">GTA GARAGE</p>
              <p className="text-xs text-garage-subtle">Crew garage hub</p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 rounded-lg border border-garage-border/70 bg-garage-surface/60 p-1 md:flex">
            {links.map((l) => {
              const badgeCount = 'badge' in l ? l.badge ?? 0 : 0

              return (
                <Link key={l.href} href={l.href}>
                  <span
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      pathname.startsWith(l.href)
                      ? 'bg-garage-neon/10 text-garage-neon'
                      : 'text-garage-subtle hover:bg-garage-muted/80 hover:text-garage-text'
                    }`}
                  >
                    <span className="relative">
                      <l.icon className="h-4 w-4" aria-hidden="true" />
                      {badgeCount > 0 && (
                        <span className="absolute -right-2 -top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-garage-surface" />
                      )}
                    </span>
                    {l.label}
                    {badgeCount > 0 && (
                      <span className="ml-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg border border-transparent p-1.5 transition-colors hover:border-garage-border hover:bg-garage-muted/70"
            >
              <Avatar src={user.avatar} username={user.username} size={32} />
              <span className="hidden sm:inline text-sm font-medium text-garage-text">{user.username}</span>
              <ChevronDown className="h-4 w-4 text-garage-subtle" aria-hidden="true" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="card absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden py-1 shadow-lift">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-garage-text hover:bg-garage-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-garage-subtle" aria-hidden="true" />
                    Profile
                  </Link>
                  <Link
                    href="/profile/edit"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-garage-text hover:bg-garage-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-garage-subtle" aria-hidden="true" />
                    Edit Profile
                  </Link>
                  <div className="border-t border-garage-border my-1" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <nav aria-label="Mobile primary" className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-garage-border/80 bg-garage-bg/92 px-2 py-2 backdrop-blur-xl md:hidden">
        {links.map((l) => {
          const badgeCount = 'badge' in l ? l.badge ?? 0 : 0

          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                pathname.startsWith(l.href) ? 'bg-garage-neon/10 text-garage-neon' : 'text-garage-subtle'
              }`}
            >
              <span className="relative">
                <l.icon className="h-4 w-4" aria-hidden="true" />
                {badgeCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-garage-bg">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </span>
              {l.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

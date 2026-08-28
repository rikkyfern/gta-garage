import { redirect } from 'next/navigation'
import { getCurrentUser, isAdminAccount } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/layout/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const [user, pendingFriendRequests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, email: true, avatar: true, role: true, blockedAt: true },
    }),
    prisma.friendRequest.count({
      where: { receiverId: session.userId, status: 'PENDING' },
    }),
  ])

  if (!user) redirect('/login')
  if (user.blockedAt) redirect('/login?blocked=1')

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar
        user={{ ...user, isAdmin: isAdminAccount(user.email, user.role) }}
        pendingFriendRequests={pendingFriendRequests}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 pb-28 md:pb-10">
        {children}
      </main>
    </div>
  )
}

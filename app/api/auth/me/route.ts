import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const session = await getCurrentUser()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      blockedAt: true,
      warnedAt: true,
      emailVerified: true,
      createdAt: true,
    },
  })

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.blockedAt) {
    return Response.json(
      {
        error:
          'Your account is temporarily restricted by GTA Garage Safety Control. Please contact an admin if you believe this needs review.',
      },
      { status: 403 }
    )
  }

  return Response.json({ user })
}

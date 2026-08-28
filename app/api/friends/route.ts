import { requireAuth, authErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await requireAuth()

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: session.userId }, { userBId: session.userId }],
      },
      include: {
        userA: { select: { id: true, username: true, avatar: true, bio: true } },
        userB: { select: { id: true, username: true, avatar: true, bio: true } },
      },
    })

    const friends = friendships.map((f) =>
      f.userAId === session.userId ? f.userB : f.userA
    )

    return Response.json({ friends })
  } catch {
    return authErrorResponse()
  }
}

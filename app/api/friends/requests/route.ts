import { requireAuth, authErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await requireAuth()

    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: session.userId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, username: true, avatar: true, bio: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ requests })
  } catch {
    return authErrorResponse()
  }
}

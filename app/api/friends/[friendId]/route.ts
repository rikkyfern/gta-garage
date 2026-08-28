import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'

type Params = { params: Promise<{ friendId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { friendId } = await params

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: session.userId, userBId: friendId },
          { userAId: friendId, userBId: session.userId },
        ],
      },
    })

    if (!friendship) return Response.json({ error: 'Friendship not found' }, { status: 404 })

    await prisma.friendship.delete({ where: { id: friendship.id } })

    return Response.json({ message: 'Friend removed' })
  } catch {
    return authErrorResponse()
  }
}

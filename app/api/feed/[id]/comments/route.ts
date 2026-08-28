import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { getVisibleActivityForUser } from '@/lib/feed-visibility'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: activityId } = await params

    const activity = await getVisibleActivityForUser(activityId, session.userId)
    if (!activity) return Response.json({ error: 'Activity not found' }, { status: 404 })

    const comments = await prisma.activityComment.findMany({
      where: { activityId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return Response.json({ comments })
  } catch {
    return authErrorResponse()
  }
}

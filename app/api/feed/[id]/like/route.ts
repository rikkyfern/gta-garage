import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { getVisibleActivityForUser } from '@/lib/feed-visibility'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: activityId } = await params

    const activity = await getVisibleActivityForUser(activityId, session.userId)
    if (!activity) return Response.json({ error: 'Activity not found' }, { status: 404 })

    const existing = await prisma.activityLike.findUnique({
      where: { activityId_userId: { activityId, userId: session.userId } },
    })
    if (existing) return Response.json({ error: 'Already liked' }, { status: 409 })

    await prisma.activityLike.create({ data: { activityId, userId: session.userId } })
    return Response.json({ message: 'Liked' }, { status: 201 })
  } catch {
    return authErrorResponse()
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: activityId } = await params

    const activity = await getVisibleActivityForUser(activityId, session.userId)
    if (!activity) return Response.json({ error: 'Activity not found' }, { status: 404 })

    await prisma.activityLike.deleteMany({
      where: { activityId, userId: session.userId },
    })

    return Response.json({ message: 'Unliked' })
  } catch {
    return authErrorResponse()
  }
}

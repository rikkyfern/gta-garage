import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    // Get friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: session.userId }, { userBId: session.userId }],
      },
      select: { userAId: true, userBId: true },
    })

    const friendIds = friendships.map((f) =>
      f.userAId === session.userId ? f.userBId : f.userAId
    )

    const visibleUserIds = [session.userId, ...friendIds]

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { userId: { in: visibleUserIds } },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          garage: { select: { id: true, garageName: true } },
          car: { select: { id: true, carName: true, carModel: true } },
          carPhoto: { select: { id: true, imageUrl: true, caption: true } },
          _count: { select: { likes: true, comments: true } },
          likes: {
            where: { userId: session.userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: { userId: { in: visibleUserIds } } }),
    ])

    const feed = activities.map((a) => ({
      activityId: a.id,
      userId: a.user.id,
      username: a.user.username,
      avatar: a.user.avatar,
      activityType: a.activityType,
      carName: a.car?.carName ?? null,
      carId: a.car?.id ?? null,
      garageName: a.garage?.garageName ?? null,
      garageId: a.garage?.id ?? null,
      imageUrl: a.carPhoto?.imageUrl ?? null,
      caption: a.carPhoto?.caption ?? null,
      createdAt: a.createdAt,
      likeCount: a._count.likes,
      commentCount: a._count.comments,
      likedByMe: a.likes.length > 0,
    }))

    return Response.json({ feed, total, page, pages: Math.ceil(total / limit) })
  } catch {
    return authErrorResponse()
  }
}

import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      blockedUsers,
      unverifiedUsers,
      totalPhotos,
      recentWarnings,
      recentActivities,
      commentCount,
      friendRequestCount,
      requests24h,
      blockedIpCount,
      rateLimited24h,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { blockedAt: { not: null } } }),
      prisma.user.count({ where: { emailVerified: false } }),
      prisma.carPhoto.count(),
      prisma.adminWarning.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.activity.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.activityComment.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.friendRequest.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.ipAccessLog.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.ipControl.count({ where: { blocked: true } }),
      prisma.ipAccessLog.count({ where: { createdAt: { gte: dayAgo }, status: 429 } }),
    ])

    const recentPhotos = await prisma.carPhoto.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: { select: { id: true, username: true, avatar: true, blockedAt: true } },
        car: { select: { id: true, carName: true } },
      },
    })

    return Response.json({
      metrics: {
        totalUsers,
        blockedUsers,
        unverifiedUsers,
        totalPhotos,
        recentWarnings,
        recentActivities,
        commentCount,
        friendRequestCount,
        requests24h,
        blockedIpCount,
        rateLimited24h,
      },
      recentPhotos,
    })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

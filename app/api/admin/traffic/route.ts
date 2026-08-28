import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [ipControls, recentLogs, totalRequests24h, blockedIpCount, rateLimited24h] =
      await Promise.all([
        prisma.ipControl.findMany({
          orderBy: { lastSeenAt: 'desc' },
          take: 100,
          include: {
            logs: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                method: true,
                path: true,
                status: true,
                reason: true,
                createdAt: true,
                userAgent: true,
              },
            },
          },
        }),
        prisma.ipAccessLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            ipAddress: true,
            method: true,
            path: true,
            status: true,
            reason: true,
            createdAt: true,
            userAgent: true,
          },
        }),
        prisma.ipAccessLog.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.ipControl.count({ where: { blocked: true } }),
        prisma.ipAccessLog.count({ where: { createdAt: { gte: dayAgo }, status: 429 } }),
      ])

    return Response.json({
      metrics: { totalRequests24h, blockedIpCount, rateLimited24h },
      ipControls,
      recentLogs,
    })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

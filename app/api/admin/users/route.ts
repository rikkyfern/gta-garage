import { NextRequest } from 'next/server'
import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim()
    const status = searchParams.get('status')

    const where = {
      ...(query
        ? {
            OR: [
              { username: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(status === 'blocked' ? { blockedAt: { not: null } } : {}),
      ...(status === 'active' ? { blockedAt: null } : {}),
      ...(status === 'unverified' ? { emailVerified: false } : {}),
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        emailVerified: true,
        blockedAt: true,
        blockReason: true,
        warnedAt: true,
        createdAt: true,
        _count: {
          select: {
            garages: true,
            cars: true,
            carPhotos: true,
            activities: true,
            activityComments: true,
            adminWarningsReceived: true,
          },
        },
      },
    })

    return Response.json({ users })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

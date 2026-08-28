import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const photos = await prisma.carPhoto.findMany({
      orderBy: { createdAt: 'desc' },
      take: 120,
      include: {
        user: { select: { id: true, username: true, email: true, avatar: true, blockedAt: true } },
        car: { select: { id: true, carName: true, carModel: true } },
      },
    })

    return Response.json({ photos })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

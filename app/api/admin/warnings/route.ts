import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const warnings = await prisma.adminWarning.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, username: true, email: true, avatar: true, blockedAt: true } },
        admin: { select: { id: true, username: true } },
      },
    })

    return Response.json({ warnings })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

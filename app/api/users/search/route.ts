import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')?.trim()

    if (!username || username.length < 2) {
      return Response.json({ error: 'Username query must be at least 2 characters' }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: username, mode: 'insensitive' },
        NOT: { id: session.userId },
      },
      select: { id: true, username: true, avatar: true, bio: true },
      take: 20,
    })

    return Response.json({ users })
  } catch {
    return authErrorResponse()
  }
}

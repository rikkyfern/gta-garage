import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const promoteSchema = z.object({
  emailOrUsername: z.string().trim().min(3).max(120),
})

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const result = promoteSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const lookup = result.data.emailOrUsername.toLowerCase()
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: lookup }, { username: { equals: result.data.emailOrUsername, mode: 'insensitive' } }],
      },
      select: { id: true },
    })

    if (!user) return Response.json({ error: 'User not found.' }, { status: 404 })

    const promoted = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: { id: true, username: true, email: true, role: true },
    })

    return Response.json({ user: promoted, promotedBy: admin.userId })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

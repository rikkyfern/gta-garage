import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const accessSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('block'),
    reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(500),
  }),
  z.object({
    action: z.literal('unblock'),
  }),
])

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const result = accessSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    if (id === admin.userId) {
      return Response.json({ error: 'Admins cannot block their own account.' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!target) return Response.json({ error: 'User not found' }, { status: 404 })

    const user = await prisma.user.update({
      where: { id },
      data:
        result.data.action === 'block'
          ? { blockedAt: new Date(), blockReason: result.data.reason }
          : { blockedAt: null, blockReason: null },
      select: {
        id: true,
        username: true,
        email: true,
        blockedAt: true,
        blockReason: true,
      },
    })

    return Response.json({ user })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

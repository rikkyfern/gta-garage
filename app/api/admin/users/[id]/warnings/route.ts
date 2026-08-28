import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const warningSchema = z.object({
  reason: z.enum(['toxic_behavior', 'bad_photo', 'spam', 'other']),
  message: z.string().trim().min(10, 'Warning message must be at least 10 characters').max(1200),
})

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const result = warningSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!target) return Response.json({ error: 'User not found' }, { status: 404 })

    const warning = await prisma.$transaction(async (tx) => {
      const created = await tx.adminWarning.create({
        data: {
          userId: id,
          adminId: admin.userId,
          reason: result.data.reason,
          message: result.data.message,
        },
        include: {
          user: { select: { id: true, username: true, email: true, avatar: true } },
          admin: { select: { id: true, username: true } },
        },
      })

      await tx.user.update({
        where: { id },
        data: { warnedAt: created.createdAt },
      })

      return created
    })

    return Response.json({ warning }, { status: 201 })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

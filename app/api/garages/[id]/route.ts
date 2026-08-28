import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { updateGarageSchema } from '@/lib/validations/garage'
import { canViewUserContent } from '@/lib/feed-visibility'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const garage = await prisma.garage.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        cars: {
          include: { photos: { take: 1, orderBy: { createdAt: 'desc' } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { cars: true } },
      },
    })

    if (!garage) return Response.json({ error: 'Garage not found' }, { status: 404 })
    if (!(await canViewUserContent(garage.userId, session.userId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({ garage })
  } catch {
    return authErrorResponse()
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await req.json()
    const result = updateGarageSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.garage.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: 'Garage not found' }, { status: 404 })
    if (existing.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const garage = await prisma.garage.update({ where: { id }, data: result.data })
    return Response.json({ garage })
  } catch {
    return authErrorResponse()
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const existing = await prisma.garage.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: 'Garage not found' }, { status: 404 })
    if (existing.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.garage.delete({ where: { id } })
    return Response.json({ message: 'Garage deleted' })
  } catch {
    return authErrorResponse()
  }
}

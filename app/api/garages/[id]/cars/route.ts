import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { createCarSchema } from '@/lib/validations/car'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: garageId } = await params

    const garage = await prisma.garage.findUnique({ where: { id: garageId } })
    if (!garage) return Response.json({ error: 'Garage not found' }, { status: 404 })
    if (garage.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const cars = await prisma.car.findMany({
      where: { garageId },
      include: {
        photos: { take: 1, orderBy: { createdAt: 'desc' } },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ cars })
  } catch {
    return authErrorResponse()
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: garageId } = await params
    const body = await req.json()
    const result = createCarSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const garage = await prisma.garage.findUnique({ where: { id: garageId } })
    if (!garage) return Response.json({ error: 'Garage not found' }, { status: 404 })
    if (garage.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const car = await prisma.car.create({
      data: { garageId, userId: session.userId, ...result.data },
    })

    await prisma.activity.create({
      data: {
        userId: session.userId,
        activityType: 'CAR_ADDED',
        carId: car.id,
        garageId,
      },
    })

    return Response.json({ car }, { status: 201 })
  } catch {
    return authErrorResponse()
  }
}

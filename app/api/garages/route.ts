import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { createGarageSchema } from '@/lib/validations/garage'

export async function GET() {
  try {
    const session = await requireAuth()
    const garages = await prisma.garage.findMany({
      where: { userId: session.userId },
      include: { _count: { select: { cars: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json({ garages })
  } catch {
    return authErrorResponse()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const result = createGarageSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const garage = await prisma.garage.create({
      data: { userId: session.userId, ...result.data },
    })

    // Create activity
    await prisma.activity.create({
      data: {
        userId: session.userId,
        activityType: 'GARAGE_CREATED',
        garageId: garage.id,
      },
    })

    return Response.json({ garage }, { status: 201 })
  } catch {
    return authErrorResponse()
  }
}

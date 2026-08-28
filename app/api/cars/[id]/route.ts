import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { updateCarSchema } from '@/lib/validations/car'
import { deleteImage } from '@/lib/cloudinary'
import { canViewUserContent } from '@/lib/feed-visibility'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        garage: { select: { id: true, garageName: true } },
        photos: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, username: true, avatar: true } },
      },
    })

    if (!car) return Response.json({ error: 'Car not found' }, { status: 404 })
    if (!(await canViewUserContent(car.userId, session.userId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({ car })
  } catch {
    return authErrorResponse()
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await req.json()
    const result = updateCarSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.car.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: 'Car not found' }, { status: 404 })
    if (existing.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const car = await prisma.car.update({ where: { id }, data: result.data })
    return Response.json({ car })
  } catch {
    return authErrorResponse()
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const existing = await prisma.car.findUnique({
      where: { id },
      include: { photos: true },
    })
    if (!existing) return Response.json({ error: 'Car not found' }, { status: 404 })
    if (existing.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Delete photos from Cloudinary
    await Promise.allSettled(existing.photos.map((p) => deleteImage(p.publicId)))

    await prisma.car.delete({ where: { id } })
    return Response.json({ message: 'Car deleted' })
  } catch {
    return authErrorResponse()
  }
}

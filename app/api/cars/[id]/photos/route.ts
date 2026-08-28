import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth'
import { deleteImage, uploadCarPhoto } from '@/lib/cloudinary'
import { isDatabaseSchemaOutOfDate, isDatabaseUnavailable } from '@/lib/prisma-errors'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function routeErrorResponse(error: unknown, context: string) {
  if (error instanceof AuthError) return authErrorResponse()

  if (isDatabaseUnavailable(error)) {
    console.error(`[car-photos:${context}:database]`, error)
    return Response.json(
      { error: 'Database is unavailable. Start PostgreSQL and try again.' },
      { status: 503 }
    )
  }

  if (isDatabaseSchemaOutOfDate(error)) {
    console.error(`[car-photos:${context}:schema]`, error)
    return Response.json(
      { error: 'Database schema is not up to date. Run migrations and try again.' },
      { status: 503 }
    )
  }

  console.error(`[car-photos:${context}]`, error)
  return Response.json({ error: 'Photo service failed. Please try again.' }, { status: 500 })
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: carId } = await params

    const car = await prisma.car.findUnique({ where: { id: carId } })
    if (!car) return Response.json({ error: 'Car not found' }, { status: 404 })
    if (car.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const photos = await prisma.carPhoto.findMany({
      where: { carId },
      orderBy: { createdAt: 'asc' },
    })

    return Response.json({ photos })
  } catch (error) {
    return routeErrorResponse(error, 'get')
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: carId } = await params

    const car = await prisma.car.findUnique({ where: { id: carId } })
    if (!car) return Response.json({ error: 'Car not found' }, { status: 404 })
    if (car.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const form = await req.formData().catch(() => null)
    if (!form) return Response.json({ error: 'Invalid upload form data' }, { status: 400 })

    const file = form.get('photo') as File | null
    const caption = (form.get('caption') as string) || undefined

    if (!file) return Response.json({ error: 'No photo provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'File must be jpg, png, or webp' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File must be under 10MB' }, { status: 400 })
    }

    const count = await prisma.carPhoto.count({ where: { carId } })
    if (count >= 5) {
      return Response.json({ error: 'Maximum 5 photos per car' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, publicId } = await uploadCarPhoto(buffer, carId, file.type).catch((error) => {
      console.error('[car-photos:upload:cloudinary]', error)
      throw new Error('UPLOAD_SERVICE_UNAVAILABLE')
    })

    try {
      const photo = await prisma.carPhoto.create({
        data: { carId, userId: session.userId, imageUrl: url, publicId, caption },
      })

      await prisma.activity.create({
        data: {
          userId: session.userId,
          activityType: 'PHOTO_UPLOADED',
          carId,
          garageId: car.garageId,
          carPhotoId: photo.id,
        },
      })

      return Response.json({ photo }, { status: 201 })
    } catch (error) {
      await deleteImage(publicId).catch((cleanupError) =>
        console.error('[car-photos:upload:cleanup]', cleanupError)
      )
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'UPLOAD_SERVICE_UNAVAILABLE') {
      return Response.json(
        { error: 'Photo upload service is unavailable. Check Cloudinary configuration and try again.' },
        { status: 503 }
      )
    }

    return routeErrorResponse(error, 'post')
  }
}

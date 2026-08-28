import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse, AuthError } from '@/lib/auth'
import { deleteImage } from '@/lib/cloudinary'
import { isDatabaseSchemaOutOfDate, isDatabaseUnavailable } from '@/lib/prisma-errors'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const photo = await prisma.carPhoto.findUnique({ where: { id } })
    if (!photo) return Response.json({ error: 'Photo not found' }, { status: 404 })
    if (photo.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await deleteImage(photo.publicId)
    await prisma.carPhoto.delete({ where: { id } })

    return Response.json({ message: 'Photo deleted' })
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse()

    if (isDatabaseUnavailable(error)) {
      console.error('[photos:delete:database]', error)
      return Response.json(
        { error: 'Database is unavailable. Start PostgreSQL and try again.' },
        { status: 503 }
      )
    }

    if (isDatabaseSchemaOutOfDate(error)) {
      console.error('[photos:delete:schema]', error)
      return Response.json(
        { error: 'Database schema is not up to date. Run migrations and try again.' },
        { status: 503 }
      )
    }

    console.error('[photos:delete]', error)
    return Response.json({ error: 'Photo delete failed. Please try again.' }, { status: 500 })
  }
}

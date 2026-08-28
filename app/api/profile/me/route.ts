import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations/profile'
import { uploadAvatar, deleteImage } from '@/lib/cloudinary'

export async function GET() {
  try {
    const session = await requireAuth()
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, email: true, avatar: true, bio: true, createdAt: true },
    })
    return Response.json({ user })
  } catch {
    return authErrorResponse()
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth()
    const contentType = req.headers.get('content-type') ?? ''

    let username: string | undefined
    let bio: string | undefined
    let avatarFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      username = (form.get('username') as string) || undefined
      bio = (form.get('bio') as string) || undefined
      avatarFile = form.get('avatar') as File | null
    } else {
      const body = await req.json()
      username = body.username
      bio = body.bio
    }

    const result = updateProfileSchema.safeParse({ username, bio })
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Check username uniqueness
    if (result.data.username) {
      const taken = await prisma.user.findFirst({
        where: { username: result.data.username, NOT: { id: session.userId } },
      })
      if (taken) return Response.json({ error: 'Username already taken' }, { status: 409 })
    }

    let avatarUrl: string | undefined
    if (avatarFile && avatarFile.size > 0) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowed.includes(avatarFile.type)) {
        return Response.json({ error: 'Avatar must be jpg, png, or webp' }, { status: 400 })
      }
      if (avatarFile.size > 5 * 1024 * 1024) {
        return Response.json({ error: 'Avatar must be under 5MB' }, { status: 400 })
      }
      const buffer = Buffer.from(await avatarFile.arrayBuffer())
      const { url } = await uploadAvatar(buffer, session.userId)
      avatarUrl = url
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(result.data.username && { username: result.data.username }),
        ...(result.data.bio !== undefined && { bio: result.data.bio }),
        ...(avatarUrl && { avatar: avatarUrl }),
      },
      select: { id: true, username: true, email: true, avatar: true, bio: true },
    })

    return Response.json({ user })
  } catch {
    return authErrorResponse()
  }
}

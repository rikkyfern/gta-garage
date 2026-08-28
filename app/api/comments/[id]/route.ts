import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const editSchema = z.object({
  commentText: z.string().min(1).max(500),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await req.json()
    const result = editSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: 'Invalid comment text' }, { status: 400 })
    }

    const comment = await prisma.activityComment.findUnique({ where: { id } })
    if (!comment) return Response.json({ error: 'Comment not found' }, { status: 404 })
    if (comment.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const updated = await prisma.activityComment.update({
      where: { id },
      data: { commentText: result.data.commentText },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    })

    return Response.json({ comment: updated })
  } catch {
    return authErrorResponse()
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const comment = await prisma.activityComment.findUnique({ where: { id } })
    if (!comment) return Response.json({ error: 'Comment not found' }, { status: 404 })
    if (comment.userId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.activityComment.delete({ where: { id } })
    return Response.json({ message: 'Comment deleted' })
  } catch {
    return authErrorResponse()
  }
}

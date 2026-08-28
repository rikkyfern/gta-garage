import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { getVisibleActivityForUser } from '@/lib/feed-visibility'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const commentSchema = z.object({
  commentText: z.string().min(1, 'Comment cannot be empty').max(500),
})

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id: activityId } = await params
    const body = await req.json()
    const result = commentSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const activity = await getVisibleActivityForUser(activityId, session.userId)
    if (!activity) return Response.json({ error: 'Activity not found' }, { status: 404 })

    const comment = await prisma.activityComment.create({
      data: { activityId, userId: session.userId, commentText: result.data.commentText },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })

    return Response.json({ comment }, { status: 201 })
  } catch {
    return authErrorResponse()
  }
}

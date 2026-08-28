import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authRouteErrorResponse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { receiverId } = await req.json()

    if (!receiverId) return Response.json({ error: 'receiverId is required' }, { status: 400 })
    if (receiverId === session.userId) {
      return Response.json({ error: 'You cannot add yourself' }, { status: 400 })
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) return Response.json({ error: 'User not found' }, { status: 404 })

    // Check for existing friendship
    const alreadyFriends = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: session.userId, userBId: receiverId },
          { userAId: receiverId, userBId: session.userId },
        ],
      },
    })
    if (alreadyFriends) return Response.json({ error: 'Already friends' }, { status: 409 })

    // Check for existing request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.userId, receiverId },
          { senderId: receiverId, receiverId: session.userId },
        ],
        status: 'PENDING',
      },
    })
    if (existingRequest) {
      return Response.json({ error: 'Friend request already pending' }, { status: 409 })
    }

    const handledRequest = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: session.userId, receiverId } },
    })

    const request = handledRequest
      ? await prisma.friendRequest.update({
          where: { id: handledRequest.id },
          data: { status: 'PENDING' },
        })
      : await prisma.friendRequest.create({
          data: { senderId: session.userId, receiverId },
        })

    return Response.json({ request }, { status: 201 })
  } catch (error) {
    console.error('[friend-request:create]', error)
    return authRouteErrorResponse(error)
  }
}

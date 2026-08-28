import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { requestId } = await req.json()

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } })
    if (!request) return Response.json({ error: 'Request not found' }, { status: 404 })
    if (request.receiverId !== session.userId) return Response.json({ error: 'Forbidden' }, { status: 403 })
    if (request.status !== 'PENDING') return Response.json({ error: 'Request already handled' }, { status: 400 })

    await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } })

    return Response.json({ message: 'Friend request rejected' })
  } catch {
    return authErrorResponse()
  }
}

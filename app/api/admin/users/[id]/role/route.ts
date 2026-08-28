import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin, authRouteErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

const roleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const result = roleSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    if (id === admin.userId && result.data.role !== 'ADMIN') {
      return Response.json({ error: 'Admins cannot remove their own admin role.' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: result.data.role },
      select: { id: true, username: true, email: true, role: true },
    })

    return Response.json({ user })
  } catch (error) {
    return authRouteErrorResponse(error)
  }
}

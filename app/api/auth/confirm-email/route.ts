import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { confirmEmailSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = confirmEmailSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: 'Invalid token' }, { status: 400 })
    }

    const { token } = result.data

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    })

    if (!record) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (record.usedAt) {
      return Response.json({ error: 'Token already used' }, { status: 400 })
    }

    if (record.expiresAt < new Date()) {
      return Response.json({ error: 'Token has expired' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return Response.json({ message: 'Email confirmed successfully. You can now log in.' })
  } catch (error) {
    console.error('[confirm-email]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

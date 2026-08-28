import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = resetPasswordSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { token, password } = result.data

    const record = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!record) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (record.usedAt) {
      return Response.json({ error: 'Token already used' }, { status: 400 })
    }

    if (record.expiresAt < new Date()) {
      return Response.json({ error: 'Token has expired' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return Response.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    console.error('[reset-password]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

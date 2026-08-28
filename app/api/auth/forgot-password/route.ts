import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { getPasswordResetLink, sendPasswordResetEmail } from '@/lib/email'
import { isDatabaseSchemaOutOfDate, isDatabaseUnavailable } from '@/lib/prisma-errors'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 3
const SUCCESS_MESSAGE = 'If that email is registered, you will receive a reset link shortly.'

function getAppUrl(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return req.nextUrl.origin
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
}

function rateLimitKey(email: string) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

async function checkRateLimit(email: string): Promise<boolean> {
  const emailHash = rateLimitKey(email)
  const now = new Date()
  const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)

  return prisma.$transaction(async (tx) => {
    const entry = await tx.passwordResetRateLimit.findUnique({ where: { emailHash } })

    if (!entry || entry.resetAt <= now) {
      await tx.passwordResetRateLimit.upsert({
        where: { emailHash },
        create: { emailHash, requestCount: 1, resetAt },
        update: { requestCount: 1, resetAt },
      })
      return true
    }

    if (entry.requestCount >= RATE_LIMIT_MAX_REQUESTS) return false

    await tx.passwordResetRateLimit.update({
      where: { emailHash },
      data: { requestCount: { increment: 1 } },
    })
    return true
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const result = forgotPasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = result.data
    const appUrl = getAppUrl(req)

    if (!(await checkRateLimit(email))) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 15 minutes before trying again.' },
        { status: 429 }
      )
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })

      try {
        await sendPasswordResetEmail(email, token, appUrl)
      } catch (error) {
        console.error('[forgot-password:email]', error)

        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.json({
            message:
              'Email delivery is unavailable in this local environment, so use the reset link below.',
            resetUrl: getPasswordResetLink(token, appUrl),
            emailDelivery: 'failed',
          })
        }

        return NextResponse.json({ message: SUCCESS_MESSAGE })
      }
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      console.error('[forgot-password:database]', error)
      return NextResponse.json(
        {
          error:
            'Database is unavailable. Start PostgreSQL, run migrations, then request a password reset again.',
        },
        { status: 503 }
      )
    }

    if (isDatabaseSchemaOutOfDate(error)) {
      console.error('[forgot-password:schema]', error)
      return NextResponse.json(
        {
          error:
            'Database schema is not up to date. Run migrations, then request a password reset again.',
        },
        { status: 503 }
      )
    }

    console.error('[forgot-password]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

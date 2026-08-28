import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { resolveAppUrl } from '@/lib/app-url'
import { checkEmailRateLimit } from '@/lib/email-rate-limit'
import { getConfirmationLink, sendConfirmationEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { isDatabaseSchemaOutOfDate, isDatabaseUnavailable } from '@/lib/prisma-errors'
import { resendConfirmationSchema } from '@/lib/validations/auth'

const SUCCESS_MESSAGE =
  'If that email belongs to an unconfirmed account, a new confirmation link has been sent.'

async function createConfirmationToken(userId: string) {
  const token = crypto.randomBytes(32).toString('hex')

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  return token
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const result = resendConfirmationSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = result.data

    if (!(await checkEmailRateLimit(email, 'email-confirmation'))) {
      return Response.json(
        { error: 'Too many requests. Please wait 15 minutes before trying again.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || user.emailVerified) {
      return Response.json({ message: SUCCESS_MESSAGE })
    }

    const appUrl = resolveAppUrl(req)
    const token = await createConfirmationToken(user.id)

    try {
      await sendConfirmationEmail(email, token, appUrl)
    } catch (error) {
      console.error('[resend-confirmation:email]', error)

      if (process.env.NODE_ENV !== 'production') {
        return Response.json({
          message:
            'Email delivery is unavailable in this local environment, so use the confirmation link below.',
          confirmationUrl: getConfirmationLink(token, appUrl),
          emailDelivery: 'failed',
        })
      }

      return Response.json(
        {
          error:
            'Email service is unavailable. Check email configuration and try resending the confirmation link again.',
        },
        { status: 503 }
      )
    }

    return Response.json({
      message: 'A new confirmation link has been sent. Please check your email.',
      ...(process.env.NODE_ENV !== 'production'
        ? { confirmationUrl: getConfirmationLink(token, appUrl), emailDelivery: 'sent' }
        : {}),
    })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      console.error('[resend-confirmation:database]', error)
      return Response.json(
        {
          error:
            'Database is unavailable. Start PostgreSQL, run migrations, then try resending the confirmation link again.',
        },
        { status: 503 }
      )
    }

    if (isDatabaseSchemaOutOfDate(error)) {
      console.error('[resend-confirmation:schema]', error)
      return Response.json(
        {
          error:
            'Database schema is not up to date. Run migrations, then try resending the confirmation link again.',
        },
        { status: 503 }
      )
    }

    console.error('[resend-confirmation]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

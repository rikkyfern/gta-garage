import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { resolveAppUrl } from '@/lib/app-url'
import { checkEmailRateLimit } from '@/lib/email-rate-limit'
import {
  getConfirmationLink,
  getPasswordResetLink,
  sendConfirmationEmail,
  sendPasswordResetEmail,
} from '@/lib/email'
import { isDatabaseSchemaOutOfDate, isDatabaseUnavailable } from '@/lib/prisma-errors'
import crypto from 'crypto'

const SUCCESS_MESSAGE = 'If that email is registered, you will receive a reset link shortly.'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const result = forgotPasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = result.data
    const appUrl = resolveAppUrl(req)

    if (!(await checkEmailRateLimit(email, 'password-reset'))) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait 15 minutes before trying again.' },
        { status: 429 }
      )
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } })

    if (user && !user.emailVerified) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })

      try {
        await sendConfirmationEmail(email, token, appUrl)
      } catch (error) {
        console.error('[forgot-password:confirmation-email]', error)

        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.json({
            message:
              'This account still needs email confirmation. Email delivery is unavailable in this local environment, so use the confirmation link below.',
            confirmationUrl: getConfirmationLink(token, appUrl),
            emailDelivery: 'failed',
          })
        }

        return NextResponse.json({
          message:
            'This account still needs email confirmation. Try resending the confirmation link before resetting your password.',
        })
      }

      return NextResponse.json({
        message:
          'This account still needs email confirmation. A new confirmation link has been sent.',
        ...(process.env.NODE_ENV !== 'production'
          ? { confirmationUrl: getConfirmationLink(token, appUrl), emailDelivery: 'sent' }
          : {}),
      })
    }

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

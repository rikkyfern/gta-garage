import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import { resolveAppUrl } from '@/lib/app-url'
import { checkEmailRateLimit } from '@/lib/email-rate-limit'
import { getConfirmationLink, sendConfirmationEmail } from '@/lib/email'
import {
  getPrismaErrorCode,
  isDatabaseSchemaOutOfDate,
  isDatabaseUnavailable,
} from '@/lib/prisma-errors'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { username, email, password } = result.data

    const appUrl = resolveAppUrl(req)
    const token = crypto.randomBytes(32).toString('hex')
    const hashedPassword = await bcrypt.hash(password, 12)
    let createdUserId: string | null = null

    try {
      const [existingEmailUser, existingUsernameUser] = await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { username } }),
      ])

      if (existingUsernameUser && existingUsernameUser.email !== email) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      }

      if (existingEmailUser) {
        if (existingEmailUser.emailVerified) {
          return NextResponse.json({ error: 'Email is already taken' }, { status: 409 })
        }

        if (!(await checkEmailRateLimit(email, 'email-confirmation'))) {
          return NextResponse.json(
            { error: 'Too many requests. Please wait 15 minutes before trying again.' },
            { status: 429 }
          )
        }

        await prisma.emailVerificationToken.create({
          data: {
            userId: existingEmailUser.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        })

        try {
          await sendConfirmationEmail(email, token, appUrl)
        } catch (error) {
          console.error('[register:resend-email]', error)

          if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json(
              {
                message:
                  'This email already has an unconfirmed account. Email delivery is unavailable in this local environment, so use the confirmation link below.',
                confirmationUrl: getConfirmationLink(token, appUrl),
                emailDelivery: 'failed',
              },
              { status: 200 }
            )
          }

          return NextResponse.json(
            {
              error:
                'This email already has an unconfirmed account, but email service is unavailable. Try resending the confirmation link again.',
            },
            { status: 503 }
          )
        }

        return NextResponse.json(
          {
            message:
              'This email already has an unconfirmed account. A new confirmation link has been sent.',
            ...(process.env.NODE_ENV !== 'production'
              ? { confirmationUrl: getConfirmationLink(token, appUrl), emailDelivery: 'sent' }
              : {}),
          },
          { status: 200 }
        )
      }

      const user = await prisma.user.create({
        data: { username, email, password: hashedPassword },
      })

      createdUserId = user.id

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
    } catch (error) {
      if (isDatabaseUnavailable(error)) {
        console.error('[register:database]', error)
        return NextResponse.json(
          {
            error:
              'Database is unavailable. Start PostgreSQL, run migrations, then try creating the account again.',
          },
          { status: 503 }
        )
      }

      if (isDatabaseSchemaOutOfDate(error)) {
        console.error('[register:schema]', error)
        return NextResponse.json(
          {
            error:
              'Database schema is not up to date. Run migrations, then try creating the account again.',
          },
          { status: 503 }
        )
      }

      if (getPrismaErrorCode(error) === 'P2002') {
        return NextResponse.json({ error: 'Email or username is already taken' }, { status: 409 })
      }

      throw error
    }

    try {
      await sendConfirmationEmail(email, token, appUrl)
    } catch (error) {
      console.error('[register:email]', error)

      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json(
          {
            message:
              'Account created. Email delivery is unavailable in this local environment, so use the confirmation link below to verify it.',
            confirmationUrl: getConfirmationLink(token, appUrl),
            emailDelivery: 'failed',
          },
          { status: 201 }
        )
      }

      if (createdUserId) {
        await prisma.user
          .delete({ where: { id: createdUserId } })
          .catch((cleanupError) => console.error('[register:email-cleanup]', cleanupError))
      }

      return NextResponse.json(
        {
          error:
            'Email service is unavailable. The account was not created. Check email configuration and try again.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        message: 'Account created. Please check your email to confirm your account.',
        ...(process.env.NODE_ENV !== 'production'
          ? { confirmationUrl: getConfirmationLink(token, appUrl), emailDelivery: 'sent' }
          : {}),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

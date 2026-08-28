import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import { getConfirmationLink, sendConfirmationEmail } from '@/lib/email'
import {
  getPrismaErrorCode,
  isDatabaseSchemaOutOfDate,
  isDatabaseUnavailable,
} from '@/lib/prisma-errors'

function getAppUrl(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return req.nextUrl.origin
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
}

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

    const appUrl = getAppUrl(req)
    const token = crypto.randomBytes(32).toString('hex')
    const hashedPassword = await bcrypt.hash(password, 12)
    let createdUserId: string | null = null

    try {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      })

      if (existing) {
        const field = existing.email === email ? 'Email' : 'Username'
        return NextResponse.json({ error: `${field} is already taken` }, { status: 409 })
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

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import { signToken } from '@/lib/jwt'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.blockedAt) {
      return Response.json(
        {
          error:
            'Your account is temporarily restricted by GTA Garage Safety Control. Please contact an admin if you believe this needs review.',
        },
        { status: 403 }
      )
    }

    if (!user.emailVerified) {
      return Response.json(
        { error: 'Please confirm your email before logging in.' },
        { status: 403 }
      )
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
      },
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    console.error('[login]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

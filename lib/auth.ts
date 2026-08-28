import { cookies } from 'next/headers'
import { verifyToken, type JWTPayload } from './jwt'
import { prisma } from './prisma'

export const COOKIE_NAME = 'gta_garage_token'

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError('Unauthorized')
  }

  const account = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { blockedAt: true },
  })

  if (!account) {
    throw new AuthError('Unauthorized')
  }

  if (account.blockedAt) {
    throw new BlockedUserError('Account blocked')
  }

  return user
}

export async function requireAdmin(): Promise<JWTPayload> {
  const user = await requireAuth()
  const account = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true, email: true },
  })

  if (!account || !isAdminAccount(account.email, account.role)) {
    throw new ForbiddenError('Admin access required')
  }

  return { ...user, role: 'ADMIN' }
}

export function isAdminAccount(email: string, role?: string | null) {
  const configuredAdmins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return role === 'ADMIN' || configuredAdmins.includes(email.toLowerCase())
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class BlockedUserError extends AuthError {
  constructor(message: string) {
    super(message)
    this.name = 'BlockedUserError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export function authErrorResponse() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 })
}

export function authRouteErrorResponse(error: unknown) {
  if (error instanceof BlockedUserError) {
    return Response.json(
      {
        error:
          'Your account is temporarily restricted by GTA Garage Safety Control. Please contact an admin if you believe this needs review.',
      },
      { status: 403 }
    )
  }

  if (error instanceof AuthError) return authErrorResponse()
  if (error instanceof ForbiddenError) return forbiddenResponse(error.message)

  return Response.json({ error: 'Internal server error' }, { status: 500 })
}

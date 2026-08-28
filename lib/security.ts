import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

const WINDOW_MS = 60 * 1000
const GENERAL_LIMIT = Number(process.env.SECURITY_RATE_LIMIT_PER_MINUTE ?? 120)
const AUTH_LIMIT = Number(process.env.SECURITY_AUTH_RATE_LIMIT_PER_MINUTE ?? 20)
const SCAN_BLOCK_THRESHOLD = Number(process.env.SECURITY_SCAN_BLOCK_THRESHOLD ?? 12)
const MAX_LOGGED_PATH = 300
const MAX_HEADER = 500

const suspiciousPathPatterns = [
  /\.env/i,
  /wp-admin/i,
  /wp-login/i,
  /phpmyadmin/i,
  /\.git/i,
  /\/adminer/i,
  /\/shell/i,
  /\/vendor\/phpunit/i,
  /\/xmlrpc\.php/i,
]

export type SecurityDecision = {
  ipAddress: string
  allowed: boolean
  status?: number
  reason?: string
  retryAfter?: number
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  const cfIp = request.headers.get('cf-connecting-ip')?.trim()

  return forwardedFor || realIp || cfIp || 'unknown'
}

export function securityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  return response
}

export async function inspectRequestSecurity(request: NextRequest): Promise<SecurityDecision> {
  const ipAddress = getClientIp(request)
  const now = new Date()
  const pathname = request.nextUrl.pathname
  const isAuthEndpoint = pathname.startsWith('/api/auth/')
  const isSuspiciousPath = suspiciousPathPatterns.some((pattern) => pattern.test(pathname))

  const current = await prisma.ipControl.findUnique({ where: { ipAddress } })

  if (current?.blocked) {
    return {
      ipAddress,
      allowed: false,
      status: 403,
      reason: current.blockReason ?? 'IP address is blocked by GTA Garage Safety Control.',
    }
  }

  const windowStartedAt =
    current && now.getTime() - current.windowStartedAt.getTime() < WINDOW_MS
      ? current.windowStartedAt
      : now
  const requestCount =
    current && windowStartedAt.getTime() === current.windowStartedAt.getTime()
      ? current.requestCount + 1
      : 1
  const scanCount = (current?.scanCount ?? 0) + (isSuspiciousPath ? 1 : 0)
  const limit = isAuthEndpoint ? AUTH_LIMIT : GENERAL_LIMIT
  const shouldAutoBlock = scanCount >= SCAN_BLOCK_THRESHOLD

  const reason = shouldAutoBlock
    ? 'Automatic block: repeated suspicious path scanning detected.'
    : requestCount > limit
      ? 'Rate limit exceeded. Please slow down before trying again.'
      : undefined

  await prisma.ipControl.upsert({
    where: { ipAddress },
    create: {
      ipAddress,
      requestCount,
      scanCount,
      blocked: shouldAutoBlock,
      blockReason: shouldAutoBlock ? reason : null,
      blockedAt: shouldAutoBlock ? now : null,
      firstSeenAt: now,
      lastSeenAt: now,
      windowStartedAt,
    },
    update: {
      requestCount,
      scanCount,
      blocked: shouldAutoBlock ? true : undefined,
      blockReason: shouldAutoBlock ? reason : undefined,
      blockedAt: shouldAutoBlock ? now : undefined,
      lastSeenAt: now,
      windowStartedAt,
    },
  })

  if (shouldAutoBlock) {
    return { ipAddress, allowed: false, status: 403, reason }
  }

  if (requestCount > limit) {
    return { ipAddress, allowed: false, status: 429, reason, retryAfter: 60 }
  }

  return { ipAddress, allowed: true }
}

export async function logIpAccess(
  request: NextRequest,
  ipAddress: string,
  status?: number,
  reason?: string
) {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`.slice(0, MAX_LOGGED_PATH)

  await prisma.ipAccessLog.create({
    data: {
      ipAddress,
      method: request.method,
      path,
      userAgent: request.headers.get('user-agent')?.slice(0, MAX_HEADER) ?? null,
      referer: request.headers.get('referer')?.slice(0, MAX_HEADER) ?? null,
      status,
      reason,
    },
  })
}

export function securityErrorResponse(decision: SecurityDecision) {
  const response = NextResponse.json(
    { error: decision.reason ?? 'Request blocked by GTA Garage Safety Control.' },
    { status: decision.status ?? 403 }
  )

  if (decision.retryAfter) {
    response.headers.set('Retry-After', String(decision.retryAfter))
  }

  return securityHeaders(response)
}

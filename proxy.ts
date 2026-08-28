import { NextResponse, type NextFetchEvent } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { COOKIE_NAME } from '@/lib/auth'
import {
  inspectRequestSecurity,
  logIpAccess,
  securityErrorResponse,
  securityHeaders,
} from '@/lib/security'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/confirm-email',
  '/forgot-password',
  '/reset-password',
]

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    try {
      const decision = await inspectRequestSecurity(request)

      if (!decision.allowed) {
        event.waitUntil(logIpAccess(request, decision.ipAddress, decision.status, decision.reason))
        return securityErrorResponse(decision)
      }

      const response = securityHeaders(NextResponse.next())
      event.waitUntil(logIpAccess(request, decision.ipAddress, 200))
      return response
    } catch {
      return securityHeaders(NextResponse.next())
    }
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null

  // Protect dashboard and other private routes
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(p))
  )
  if (!isPublic && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return securityHeaders(NextResponse.redirect(loginUrl))
  }

  return securityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

import type { NextRequest } from 'next/server'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])
const FALLBACK_APP_URL = 'http://localhost:3000'

function firstHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null
}

function normalizeUrl(value: string | undefined) {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function isLocalUrl(value: string | null) {
  if (!value) return false

  try {
    return LOCAL_HOSTS.has(new URL(value).hostname)
  } catch {
    return false
  }
}

function requestUrl(req: NextRequest) {
  const forwardedHost = firstHeaderValue(req.headers.get('x-forwarded-host'))
  const forwardedProto = firstHeaderValue(req.headers.get('x-forwarded-proto'))
  const host = forwardedHost ?? req.nextUrl.host
  const protocol = forwardedProto ?? req.nextUrl.protocol.replace(/:$/, '')

  return normalizeUrl(`${protocol}://${host}`) ?? normalizeUrl(req.nextUrl.origin)
}

export function resolveAppUrl(req: NextRequest) {
  const configured =
    normalizeUrl(process.env.APP_URL) ?? normalizeUrl(process.env.NEXT_PUBLIC_APP_URL)
  const requestOrigin = requestUrl(req)

  if (configured && !isLocalUrl(configured)) return configured
  if (requestOrigin && !isLocalUrl(requestOrigin)) return requestOrigin

  return configured ?? requestOrigin ?? FALLBACK_APP_URL
}

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 3

export function emailRateLimitKey(email: string, purpose: string) {
  return crypto
    .createHash('sha256')
    .update(`${purpose}:${email.trim().toLowerCase()}`)
    .digest('hex')
}

export async function checkEmailRateLimit(email: string, purpose: string): Promise<boolean> {
  const emailHash = emailRateLimitKey(email, purpose)
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

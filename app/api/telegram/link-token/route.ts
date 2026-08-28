import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { authRouteErrorResponse, requireAuth } from '@/lib/auth'
import { isPublicHttpsUrl, isTelegramConfigured, telegramWebhookUrl } from '@/lib/telegram'

const TOKEN_TTL_MINUTES = 10

function createTelegramToken() {
  return `GG-${randomBytes(3).toString('hex').toUpperCase()}`
}

function botDeepLink(token: string) {
  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '')
  return username ? `https://t.me/${username}?start=${token}` : null
}

function telegramDiagnostics() {
  const webhookUrl = telegramWebhookUrl()

  return {
    configured: isTelegramConfigured(),
    webhookUrl,
    webhookPublic: isPublicHttpsUrl(webhookUrl),
  }
}

export async function GET() {
  try {
    const session = await requireAuth()
    const account = await prisma.telegramAccount.findUnique({
      where: { userId: session.userId },
      select: {
        telegramUsername: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
      },
    })

    return Response.json({ connected: Boolean(account), account, telegram: telegramDiagnostics() })
  } catch (error) {
    console.error('[telegram/link-token:GET]', error)
    return authRouteErrorResponse(error)
  }
}

export async function POST() {
  try {
    const session = await requireAuth()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_MINUTES * 60 * 1000)

    await prisma.telegramLinkToken.updateMany({
      where: {
        userId: session.userId,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    })

    const token = createTelegramToken()
    await prisma.telegramLinkToken.create({
      data: {
        userId: session.userId,
        token,
        expiresAt,
      },
    })

    return Response.json({
      token,
      expiresAt,
      botDeepLink: botDeepLink(token),
      command: `/start ${token}`,
      telegram: telegramDiagnostics(),
    })
  } catch (error) {
    console.error('[telegram/link-token:POST]', error)
    return authRouteErrorResponse(error)
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth()
    await prisma.telegramAccount.deleteMany({ where: { userId: session.userId } })
    return Response.json({ message: 'Telegram disconnected' })
  } catch (error) {
    console.error('[telegram/link-token:DELETE]', error)
    return authRouteErrorResponse(error)
  }
}

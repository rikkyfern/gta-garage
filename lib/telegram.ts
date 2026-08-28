import { prisma } from '@/lib/prisma'

const TELEGRAM_API_BASE = 'https://api.telegram.org'
const MAX_RESULTS = 8

type TelegramUser = {
  id: number
  is_bot?: boolean
  first_name?: string
  last_name?: string
  username?: string
}

type TelegramChat = {
  id: number
}

export type TelegramMessage = {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  text?: string
}

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
}

export function isTelegramSecretValid(headerValue: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  return Boolean(expected) && headerValue === expected
}

export function isTelegramConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN &&
      process.env.TELEGRAM_WEBHOOK_SECRET &&
      process.env.TELEGRAM_BOT_USERNAME
  )
}

export function telegramWebhookUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return null
  return `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`
}

export function isPublicHttpsUrl(value: string | null) {
  if (!value) return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}

export async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not configured')
    return
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`Telegram sendMessage failed: ${response.status} ${body}`)
  }
}

export async function linkTelegramAccount(tokenText: string, telegramUser: TelegramUser) {
  const normalizedToken = tokenText.toUpperCase().replace(/\s+/g, '')
  const now = new Date()

  const linkToken = await prisma.telegramLinkToken.findFirst({
    where: {
      token: normalizedToken,
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: { select: { username: true } } },
  })

  if (!linkToken) {
    return 'Kode connect tidak valid atau sudah expired. Generate kode baru dari halaman Profile GTA GARAGE.'
  }

  const telegramUserId = String(telegramUser.id)
  const existingTelegramAccount = await prisma.telegramAccount.findUnique({
    where: { telegramUserId },
    select: { userId: true },
  })

  if (existingTelegramAccount && existingTelegramAccount.userId !== linkToken.userId) {
    return 'Telegram ini sudah terhubung ke akun GTA GARAGE lain. Disconnect dulu dari akun lama sebelum connect ulang.'
  }

  await prisma.$transaction([
    prisma.telegramAccount.upsert({
      where: { userId: linkToken.userId },
      create: {
        userId: linkToken.userId,
        telegramUserId,
        telegramUsername: telegramUser.username ?? null,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
      },
      update: {
        telegramUserId,
        telegramUsername: telegramUser.username ?? null,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
      },
    }),
    prisma.telegramLinkToken.update({
      where: { id: linkToken.id },
      data: { usedAt: now },
    }),
  ])

  return `Telegram connected ke GTA GARAGE sebagai ${linkToken.user.username}.\n\nCari mobil kamu dengan:\n/find sultan\n/where comet`
}

export function parseTelegramCommand(text: string) {
  const trimmed = text.trim()
  const [rawCommand = '', ...rest] = trimmed.split(/\s+/)
  const command = rawCommand.split('@')[0].toLowerCase()
  const query = rest.join(' ').trim()

  return { command, query }
}

export async function findCarsForTelegramUser(telegramUserId: number, query: string) {
  const account = await prisma.telegramAccount.findUnique({
    where: { telegramUserId: String(telegramUserId) },
    include: { user: { select: { username: true } } },
  })

  if (!account) {
    return 'Telegram kamu belum connected ke GTA GARAGE.\n\nBuka Profile di app, generate kode Telegram, lalu kirim /start KODE ke bot ini.'
  }

  const cleanedQuery = query.trim()
  if (cleanedQuery.length < 2) {
    return 'Ketik minimal 2 karakter.\n\nContoh:\n/find sultan\n/where elegy'
  }

  const cars = await prisma.car.findMany({
    where: {
      userId: account.userId,
      OR: [
        { carName: { contains: cleanedQuery, mode: 'insensitive' } },
        { carModel: { contains: cleanedQuery, mode: 'insensitive' } },
        { location: { contains: cleanedQuery, mode: 'insensitive' } },
        {
          garage: {
            is: {
              garageName: { contains: cleanedQuery, mode: 'insensitive' },
            },
          },
        },
      ],
    },
    include: {
      garage: { select: { garageName: true, location: true } },
      _count: { select: { photos: true } },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: MAX_RESULTS,
  })

  if (cars.length === 0) {
    return `Tidak ada mobil yang cocok untuk "${cleanedQuery}".`
  }

  const lines = cars.flatMap((car, index) => [
    `${index + 1}. ${car.carName}`,
    car.carModel ? `Model: ${car.carModel}` : null,
    `Garage: ${car.garage.garageName}`,
    car.location ? `Position: ${car.location}` : car.garage.location ? `Garage location: ${car.garage.location}` : 'Position: belum diisi',
    `Photos: ${car._count.photos}`,
    '',
  ])

  return [`Found ${cars.length} car${cars.length === 1 ? '' : 's'} for "${cleanedQuery}":`, '', ...lines]
    .filter((line): line is string => line !== null)
    .join('\n')
    .trim()
}

export function helpText() {
  return [
    'GTA GARAGE car finder',
    '',
    'Commands:',
    '/find sultan',
    '/where comet',
    '',
    'Telegram ini hanya bisa mencari mobil dari akun GTA GARAGE kamu sendiri.',
  ].join('\n')
}

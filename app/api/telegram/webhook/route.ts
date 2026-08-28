import { NextRequest } from 'next/server'
import {
  findCarsForTelegramUser,
  helpText,
  isPublicHttpsUrl,
  isTelegramConfigured,
  isTelegramSecretValid,
  linkTelegramAccount,
  parseTelegramCommand,
  sendTelegramMessage,
  telegramWebhookUrl,
  type TelegramUpdate,
} from '@/lib/telegram'

export async function GET() {
  const webhookUrl = telegramWebhookUrl()

  return Response.json({
    ok: true,
    configured: isTelegramConfigured(),
    webhookUrl,
    webhookPublic: isPublicHttpsUrl(webhookUrl),
  })
}

export async function POST(req: NextRequest) {
  if (!isTelegramSecretValid(req.headers.get('x-telegram-bot-api-secret-token'))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const update = (await req.json()) as TelegramUpdate
  const message = update.message
  const text = message?.text?.trim()
  const from = message?.from

  if (!message || !text || !from || from.is_bot) {
    return Response.json({ ok: true })
  }

  const { command, query } = parseTelegramCommand(text)
  let reply: string

  if (command === '/start' && query) {
    reply = await linkTelegramAccount(query, from)
  } else if (command === '/start' || command === '/help') {
    reply = helpText()
  } else if (command === '/find' || command === '/where') {
    reply = await findCarsForTelegramUser(from.id, query)
  } else if (text.startsWith('/')) {
    reply = 'Command belum dikenal. Pakai /find nama_mobil atau /where nama_mobil.'
  } else {
    reply = await findCarsForTelegramUser(from.id, text)
  }

  await sendTelegramMessage(message.chat.id, reply)
  return Response.json({ ok: true })
}

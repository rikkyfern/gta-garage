'use client'

import { useEffect, useState } from 'react'
import { Copy, Link2, RefreshCw, Send, Unlink } from 'lucide-react'
import { ErrorMessage, SuccessMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type TelegramStatus = {
  connected: boolean
  telegram?: TelegramDiagnostics
  account: {
    telegramUsername: string | null
    firstName: string | null
    lastName: string | null
    updatedAt: string
  } | null
}

type LinkTokenResponse = {
  token: string
  expiresAt: string
  botDeepLink: string | null
  command: string
  telegram?: TelegramDiagnostics
}

type TelegramDiagnostics = {
  configured: boolean
  webhookUrl: string | null
  webhookPublic: boolean
}

export function TelegramConnectCard() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [linkToken, setLinkToken] = useState<LinkTokenResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadStatus() {
    const res = await fetch('/api/telegram/link-token')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to load Telegram status')
    setStatus(data)
  }

  useEffect(() => {
    loadStatus()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function generateCode() {
    setError('')
    setSuccess('')
    setActionLoading(true)

    try {
      const res = await fetch('/api/telegram/link-token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate Telegram code')
      setLinkToken(data)
      setSuccess('Telegram connect code generated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate Telegram code')
    } finally {
      setActionLoading(false)
    }
  }

  async function disconnect() {
    setError('')
    setSuccess('')
    setActionLoading(true)

    try {
      const res = await fetch('/api/telegram/link-token', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to disconnect Telegram')
      setLinkToken(null)
      await loadStatus()
      setSuccess('Telegram disconnected.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Telegram')
    } finally {
      setActionLoading(false)
    }
  }

  async function copyCommand() {
    if (!linkToken) return
    await navigator.clipboard.writeText(linkToken.command)
    setSuccess('Command copied.')
  }

  const displayName = status?.account?.telegramUsername
    ? `@${status.account.telegramUsername}`
    : [status?.account?.firstName, status?.account?.lastName].filter(Boolean).join(' ')
  const diagnostics = linkToken?.telegram ?? status?.telegram
  const webhookWarning =
    diagnostics && (!diagnostics.configured || !diagnostics.webhookPublic)
      ? !diagnostics.configured
        ? 'Telegram bot settings are incomplete. Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, and TELEGRAM_BOT_USERNAME.'
        : 'Telegram cannot call localhost. Deploy the app or use a public HTTPS tunnel, then register the webhook URL shown below.'
      : ''

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-garage-neon-blue">
            <Send className="h-4 w-4" aria-hidden="true" />
            Telegram Car Finder
          </div>
          <h2 className="text-xl font-semibold text-garage-text">Find your cars from Telegram</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-garage-subtle">
            Connect your Telegram account, then use /find or /where in the bot to search only your GTA GARAGE cars.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner size="sm" />
        ) : status?.connected ? (
          <button type="button" onClick={disconnect} className="btn-secondary text-sm" disabled={actionLoading}>
            {actionLoading ? <LoadingSpinner size="sm" /> : <Unlink className="h-4 w-4" aria-hidden="true" />}
            Disconnect
          </button>
        ) : (
          <button type="button" onClick={generateCode} className="btn-primary text-sm" disabled={actionLoading}>
            {actionLoading ? <LoadingSpinner size="sm" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
            Generate Code
          </button>
        )}
      </div>

      {!loading && status?.connected && (
        <div className="mt-4 rounded-lg border border-garage-border bg-garage-surface/70 p-4 text-sm">
          <p className="font-semibold text-garage-text">Connected{displayName ? ` as ${displayName}` : ''}</p>
          <p className="mt-1 text-garage-subtle">Try /find sultan or /where comet in Telegram.</p>
        </div>
      )}

      {webhookWarning && (
        <div className="mt-4 rounded-lg border border-garage-neon-amber/30 bg-garage-neon-amber/10 p-4 text-sm">
          <p className="font-semibold text-garage-text">Bot webhook needs attention</p>
          <p className="mt-1 leading-6 text-garage-subtle">{webhookWarning}</p>
          {diagnostics?.webhookUrl && (
            <code className="mt-3 block break-all rounded-md border border-garage-border bg-garage-bg px-3 py-2 text-xs text-garage-text">
              {diagnostics.webhookUrl}
            </code>
          )}
        </div>
      )}

      {linkToken && (
        <div className="mt-4 space-y-3 rounded-lg border border-garage-border bg-garage-surface/70 p-4">
          <p className="text-sm text-garage-subtle">Send this command to the GTA GARAGE bot. The code expires in 10 minutes.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <code className="flex-1 rounded-md border border-garage-border bg-garage-bg px-3 py-2 text-sm text-garage-text">
              {linkToken.command}
            </code>
            <button type="button" onClick={copyCommand} className="btn-secondary text-sm">
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy
            </button>
            {linkToken.botDeepLink && (
              <a href={linkToken.botDeepLink} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                <Send className="h-4 w-4" aria-hidden="true" />
                Open Bot
              </a>
            )}
          </div>
          <button type="button" onClick={generateCode} className="muted-link inline-flex items-center gap-2 text-sm" disabled={actionLoading}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Regenerate code
          </button>
        </div>
      )}

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}
      {success && <div className="mt-4"><SuccessMessage message={success} /></div>}
    </section>
  )
}

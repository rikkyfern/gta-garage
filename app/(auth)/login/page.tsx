'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, MailCheck, ShieldCheck } from 'lucide-react'
import { ErrorMessage, SuccessMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ message: string; confirmationUrl?: string } | null>(null)
  const [blockedNotice, setBlockedNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const isBlockedRedirect = new URLSearchParams(window.location.search).get('blocked') === '1'
    if (isBlockedRedirect) {
      setBlockedNotice(
        'Your account is temporarily restricted by GTA Garage Safety Control. Please contact an admin if you believe this needs review.'
      )
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Authentication server is not reachable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendConfirmation() {
    setError('')
    setSuccess(null)
    setResending(true)

    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'Could not resend confirmation email')
        return
      }

      setSuccess({
        message: data.message ?? 'A new confirmation link has been sent. Please check your email.',
        confirmationUrl: data.confirmationUrl,
      })
    } catch {
      setError('Authentication server is not reachable. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#eaf7f2] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#23876c]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Crew access
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#171d2d]">Welcome back :)</h1>
        <p className="mt-3 text-sm leading-6 text-[#6d7a8a]">
          Enter your garage space and pick up where your crew left off.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? 'login-error' : undefined}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8795]">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-lg border border-[#dfe8ec] bg-[#f4f8fa] px-4 py-3 text-sm text-[#1d2434] outline-none transition-all placeholder:text-[#9aa6b2] focus:border-[#52b8d8] focus:bg-white focus:ring-4 focus:ring-[#52b8d8]/15"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8795]">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="w-full rounded-lg border border-[#dfe8ec] bg-[#f4f8fa] px-4 py-3 text-sm text-[#1d2434] outline-none transition-all placeholder:text-[#9aa6b2] focus:border-[#52b8d8] focus:bg-white focus:ring-4 focus:ring-[#52b8d8]/15"
            placeholder="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {(error || blockedNotice) && (
          <div id="login-error">
            <ErrorMessage message={error || blockedNotice} />
          </div>
        )}
        {error === 'Please confirm your email before logging in.' && (
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#b8dce9] bg-white px-5 py-3 text-sm font-semibold text-[#258fe6] transition-all hover:bg-[#f1f9fc] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={resending || !form.email}
            onClick={handleResendConfirmation}
          >
            {resending ? <LoadingSpinner size="sm" /> : <MailCheck className="h-4 w-4" aria-hidden="true" />}
            Resend Confirmation Email
          </button>
        )}
        {success && <SuccessMessage message={success.message} />}
        {success?.confirmationUrl && (
          <Link href={success.confirmationUrl} className="block text-sm text-garage-neon hover:underline">
            Open local confirmation link
          </Link>
        )}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#258fe6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,143,230,0.22)] transition-all hover:bg-[#1d7fcc] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
          Enter Garage
        </button>

        <div className="flex flex-col gap-2 pt-2 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <Link href="/forgot-password" className="text-[#6d7a8a] hover:text-[#258fe6]">
            Forgot password?
          </Link>
          <Link href="/register" className="font-medium text-[#258fe6] hover:text-[#176faf]">
            Create account
          </Link>
        </div>
      </form>
    </div>
  )
}

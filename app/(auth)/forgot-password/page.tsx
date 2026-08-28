'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { ErrorMessage, SuccessMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ message: string; resetUrl?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      setSuccess({
        message: data.message ?? 'If that email is registered, you will receive a reset link shortly.',
        resetUrl: data.resetUrl,
      })
    } catch {
      setError('Network error. Check that the app server is running, then try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#23876c]">Account recovery</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#171d2d]">Reset access</h1>
        <p className="mt-3 text-sm leading-6 text-[#6d7a8a]">Enter your email and we&apos;ll send a private recovery link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8795]">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-lg border border-[#dfe8ec] bg-[#f4f8fa] px-4 py-3 text-sm text-[#1d2434] outline-none transition-all placeholder:text-[#9aa6b2] focus:border-[#52b8d8] focus:bg-white focus:ring-4 focus:ring-[#52b8d8]/15"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success.message} />}
        {success?.resetUrl && (
          <Link href={success.resetUrl} className="block text-sm text-garage-neon hover:underline">
            Open local reset link
          </Link>
        )}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#258fe6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,143,230,0.22)] transition-all hover:bg-[#1d7fcc] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Send Reset Link
        </button>
      </form>

      <Link href="/login" className="mt-4 flex items-center justify-center gap-2 text-sm text-[#6d7a8a] transition-colors hover:text-[#258fe6]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to login
      </Link>
    </div>
  )
}

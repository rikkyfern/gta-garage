'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Mail, ShieldAlert, UserPlus } from 'lucide-react'
import { ErrorMessage, SuccessMessage } from '@/components/ui/ErrorMessage'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ message: string; confirmationUrl?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordChecks = [
    { label: 'At least 8 characters', valid: form.password.length >= 8 },
    { label: 'Uppercase and lowercase letters', valid: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) },
    { label: 'At least one number', valid: /[0-9]/.test(form.password) },
    { label: 'At least one symbol', valid: /[^A-Za-z0-9]/.test(form.password) },
  ]

  function getValidationMessage(data: { error?: string; details?: Record<string, string[]> }) {
    const passwordError = data.details?.password?.[0]
    const usernameError = data.details?.username?.[0]
    const emailError = data.details?.email?.[0]

    return passwordError ?? usernameError ?? emailError ?? data.error ?? 'Registration failed'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(getValidationMessage(data))
        return
      }

      setSuccess({
        message: data.message ?? 'Account created. Please check your email to confirm your account.',
        confirmationUrl: data.confirmationUrl,
      })
    } catch {
      setError('Network error. Check that the app server is running, then try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
          <Mail className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-garage-text">Check your email</h1>
        <SuccessMessage message={success.message} />
        {success.confirmationUrl && (
          <Link href={success.confirmationUrl} className="block text-sm text-garage-neon hover:underline">
            Confirm this local account
          </Link>
        )}
        <Link href="/login" className="text-sm text-garage-neon hover:underline">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#23876c]">New player</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#171d2d]">Create account</h1>
        <p className="mt-3 text-sm leading-6 text-[#6d7a8a]">Claim your handle and start building a garage profile your crew can recognize.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8795]">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            className="w-full rounded-lg border border-[#dfe8ec] bg-[#f4f8fa] px-4 py-3 text-sm text-[#1d2434] outline-none transition-all placeholder:text-[#9aa6b2] focus:border-[#52b8d8] focus:bg-white focus:ring-4 focus:ring-[#52b8d8]/15"
            placeholder="franklin_clinton"
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
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
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <div className="mt-3 rounded-lg border border-[#dfe8ec] bg-[#f6faf8] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8795]">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Strong password required
            </div>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              {passwordChecks.map((check) => (
                <div key={check.label} className={check.valid ? 'flex items-center gap-2 text-[#23876c]' : 'flex items-center gap-2 text-[#8a96a3]'}>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {check.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#258fe6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,143,230,0.22)] transition-all hover:bg-[#1d7fcc] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
          Create Account
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[#6d7a8a]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#258fe6] hover:text-[#176faf]">
          Sign in
        </Link>
      </p>
    </div>
  )
}

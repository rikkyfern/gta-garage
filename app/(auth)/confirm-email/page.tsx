'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage, SuccessMessage } from '@/components/ui/ErrorMessage'

function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No token provided.')
      return
    }

    fetch('/api/auth/confirm-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.message) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.error ?? 'Confirmation failed.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Confirmation failed.')
      })
  }, [token])

  return (
    <div className="card p-8 text-center space-y-4">
      {status === 'loading' && (
        <>
          <LoadingSpinner size="lg" />
          <p className="text-garage-subtle text-sm">Confirming your email…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-garage-neon/10 text-garage-neon">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-garage-text">Email Confirmed</h1>
          <SuccessMessage message={message} />
          <Link href="/login" className="btn-primary inline-block mt-2">Sign In</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <AlertCircle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-garage-text">Confirmation Failed</h1>
          <ErrorMessage message={message} />
          <Link href="/register" className="text-sm text-garage-neon hover:underline">Back to Register</Link>
        </>
      )}
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-8 text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-garage-subtle text-sm">Preparing confirmation...</p>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  )
}

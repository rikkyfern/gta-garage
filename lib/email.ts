import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'GTA Garage <noreply@example.com>'
const DEFAULT_APP_URL =
  process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function appUrl(appUrlOverride?: string) {
  return (appUrlOverride ?? DEFAULT_APP_URL).replace(/\/$/, '')
}

export function getConfirmationLink(token: string, appUrlOverride?: string) {
  return `${appUrl(appUrlOverride)}/confirm-email?token=${token}`
}

export function getPasswordResetLink(token: string, appUrlOverride?: string) {
  return `${appUrl(appUrlOverride)}/reset-password?token=${token}`
}

export async function sendConfirmationEmail(email: string, token: string, appUrlOverride?: string) {
  const link = getConfirmationLink(token, appUrlOverride)
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Confirm your GTA Garage account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#171b26;color:#e2e6f0;border-radius:12px;">
        <h1 style="color:#4ade80;margin-bottom:8px;">GTA GARAGE</h1>
        <p>Welcome! Click below to confirm your email address:</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4ade80;color:#0f1117;border-radius:8px;font-weight:600;text-decoration:none;">
          Confirm Email
        </a>
        <p style="color:#8892a4;font-size:13px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string, appUrlOverride?: string) {
  const link = getPasswordResetLink(token, appUrlOverride)
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your GTA Garage password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#171b26;color:#e2e6f0;border-radius:12px;">
        <h1 style="color:#4ade80;margin-bottom:8px;">GTA GARAGE</h1>
        <p>You requested a password reset. Click below to set a new password:</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4ade80;color:#0f1117;border-radius:8px;font-weight:600;text-decoration:none;">
          Reset Password
        </a>
        <p style="color:#8892a4;font-size:13px;">This link expires in 1 hour and can only be used once. If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

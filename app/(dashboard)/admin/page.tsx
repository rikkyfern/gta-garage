import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { AdminSafetyConsole } from './AdminSafetyConsole'

export const metadata = { title: 'Admin SOC' }

export default async function AdminPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/dashboard')
  }

  return <AdminSafetyConsole />
}

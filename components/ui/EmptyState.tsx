import type { ReactNode } from 'react'
import { CarFront } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-garage-neon/20 bg-garage-neon/10 text-garage-neon">
        {icon ?? <CarFront className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h3 className="section-title mb-2">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-6 text-garage-subtle">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

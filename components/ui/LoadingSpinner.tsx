export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size]
  return (
    <div className={`${s} rounded-full border-2 border-garage-neon/20 border-t-garage-neon animate-spin`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  username: string
  size?: number
  className?: string
}

export function Avatar({ src, username, size = 40, className = '' }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const initials = username.slice(0, 2).toUpperCase()

  useEffect(() => {
    setImageFailed(false)
  }, [src])

  if (src && !imageFailed) {
    return (
      <Image
        src={src}
        alt={username}
        width={size}
        height={size}
        className={`rounded-full border border-garage-border object-cover shadow-sm ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-garage-neon/25 bg-garage-neon/10 font-semibold text-garage-neon shadow-sm ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

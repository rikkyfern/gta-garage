'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CarouselPhoto = {
  src: string
  alt: string
  caption?: string | null
  href?: string
}

type PhotoCarouselProps = {
  photos: CarouselPhoto[]
  fallback?: ReactNode
  aspect?: string
  priority?: boolean
}

export function PhotoCarousel({
  photos,
  fallback,
  aspect = 'aspect-square',
  priority = false,
}: PhotoCarouselProps) {
  const [index, setIndex] = useState(0)
  const hasPhotos = photos.length > 0
  const current = photos[index]

  function previous() {
    setIndex((value) => (value === 0 ? photos.length - 1 : value - 1))
  }

  function next() {
    setIndex((value) => (value === photos.length - 1 ? 0 : value + 1))
  }

  if (!hasPhotos) {
    return (
      <div className={`relative flex ${aspect} items-center justify-center overflow-hidden bg-garage-muted`}>
        {fallback}
      </div>
    )
  }

  const image = (
    <Image
      src={current.src}
      alt={current.alt}
      fill
      sizes="(min-width: 1024px) 680px, 100vw"
      className="object-cover"
      priority={priority}
      unoptimized
    />
  )

  return (
    <div className={`relative ${aspect} overflow-hidden bg-garage-muted`}>
      {current.href ? (
        <Link href={current.href} className="absolute inset-0">
          {image}
        </Link>
      ) : (
        image
      )}

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-garage-bg/75 text-garage-text shadow-card backdrop-blur transition-colors hover:bg-garage-bg"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-garage-bg/75 text-garage-text shadow-card backdrop-blur transition-colors hover:bg-garage-bg"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((photo, photoIndex) => (
              <button
                key={`${photo.src}-${photoIndex}`}
                type="button"
                onClick={() => setIndex(photoIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  photoIndex === index ? 'w-5 bg-garage-neon-blue' : 'w-1.5 bg-white/75'
                }`}
                aria-label={`Show photo ${photoIndex + 1}`}
              />
            ))}
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-garage-bg/75 px-2.5 py-1 text-xs font-semibold text-garage-text backdrop-blur">
            {index + 1}/{photos.length}
          </span>
        </>
      )}

      {current.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-4 pb-8 pt-12">
          <p className="line-clamp-2 text-sm text-white">{current.caption}</p>
        </div>
      )}
    </div>
  )
}

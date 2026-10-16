'use client'

import { useState } from 'react'

export function TutorPhoto({
  photoUrl,
  initial,
  alt,
  className,
}: {
  photoUrl?: string | null
  initial: string
  alt: string
  className: string
}) {
  const [failed, setFailed] = useState(false)

  if (!photoUrl || failed) {
    return (
      <div
        className={`${className} flex items-center justify-center font-bold`}
        style={{ backgroundColor: '#ffd200', color: '#006400' }}
        aria-hidden={alt === '' ? true : undefined}
      >
        {initial}
      </div>
    )
  }

  return (
    <img
      src={photoUrl}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  )
}

'use client'

import { useState } from 'react'
import type { TutorGender } from '@/lib/gender'

function GenderSilhouette({ gender }: { gender: TutorGender }) {
  return (
    <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" aria-hidden="true">
      {gender === 'Female' ? (
        <>
          <path d="M32 6c7 0 12 5 12 12 0 2-2 6-4 8 8 2 14 8 16 16-6 2-16 3-24 3s-18-1-24-3c2-8 8-14 16-16-2-2-4-6-4-8 0-7 5-12 12-12z" fill="#006400" />
          <path d="M18 40c2 10 6 18 14 18s12-8 14-18c-4 2-9 3-14 3s-10-1-14-3z" fill="#006400" />
        </>
      ) : (
        <>
          <circle cx="32" cy="16" r="10" fill="#006400" />
          <path d="M12 58c2-16 8-24 20-24s18 8 20 24H12z" fill="#006400" />
        </>
      )}
    </svg>
  )
}

export function TutorPhoto({
  photoUrl,
  gender,
  initial,
  alt,
  className,
}: {
  photoUrl?: string | null
  gender?: string | null
  initial: string
  alt: string
  className: string
}) {
  const [failed, setFailed] = useState(false)
  const knownGender = gender === 'Male' || gender === 'Female' ? gender : null

  if (!photoUrl || failed) {
    if (knownGender) {
      return (
        <div
          className={`${className} flex items-center justify-center overflow-hidden`}
          style={{ backgroundColor: '#ffd200' }}
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        >
          <GenderSilhouette gender={knownGender} />
        </div>
      )
    }
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

'use client'

import { useTutorSession } from '@/lib/use-tutor-session'

export function BookSlot({ tutorId }: { tutorId: string }) {
  const { ready, tutorId: viewerTutorId } = useTutorSession()
  if (!ready || viewerTutorId) return null
  return (
    <a
      href={`/tutors/${tutorId}/book`}
      className="inline-block bg-amber-400 text-black px-6 py-2 rounded-lg font-medium"
    >
      Book a Time Slot
    </a>
  )
}

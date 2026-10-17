'use client'

import Link from 'next/link'
import { GraduationCap, Search, UserPlus } from 'lucide-react'
import { AuthMenu } from '@/components/AuthMenu'
import { useTutorSession } from '@/lib/use-tutor-session'

const linkClass = 'inline-flex items-center gap-1.5 font-bold text-zw-green'
const linkStyle = { color: '#006400' }

export function SiteNav() {
  const { ready, isTutor, name, userId } = useTutorSession()
  const isParent = Boolean(userId) && !isTutor

  if (!ready) {
    return <nav className="h-9" aria-hidden="true" />
  }

  if (isTutor) {
    return (
      <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
        <Link href="/tutors" className={linkClass} style={linkStyle}>
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          Tutors
        </Link>
        <Link href="/profile" className={linkClass} style={linkStyle}>
          {name || 'My profile'}
        </Link>
      </nav>
    )
  }

  return (
    <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
      <Link href="/tutors" className={linkClass} style={linkStyle}>
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        Find Tutors
      </Link>
      {isParent ? (
        <Link href="/account" className={linkClass} style={linkStyle}>
          My profile
        </Link>
      ) : (
        <Link href="/tutor-signup" className={linkClass} style={linkStyle}>
          <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
          Become a Tutor
        </Link>
      )}
      <Link href="/parent-signup" className={linkClass} style={linkStyle}>
        <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
        Parent Sign Up
      </Link>
      <AuthMenu />
    </nav>
  )
}

export function ShowUnlessTutor({ children }: { children: React.ReactNode }) {
  const { ready, isTutor, userId } = useTutorSession()
  if (!ready || isTutor || userId) return null
  return <>{children}</>
}

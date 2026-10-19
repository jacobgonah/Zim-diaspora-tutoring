'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Menu, Search, UserPlus, X } from 'lucide-react'
import { AuthMenu } from '@/components/AuthMenu'
import { useTutorSession } from '@/lib/use-tutor-session'

const linkClass =
  'flex w-full items-center gap-2 rounded-lg px-3 py-3 font-bold text-neutral-200 transition-colors hover:bg-white/5 hover:text-amber-400 md:inline-flex md:w-auto md:gap-1.5 md:px-0 md:py-0 md:text-neutral-300 md:hover:bg-transparent'
const linkStyle = {}

function NavShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-neutral-100 transition-colors hover:border-amber-400 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 md:hidden"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      <nav
        onClick={() => setOpen(false)}
        className={`${open ? 'flex' : 'hidden'} absolute right-0 top-12 z-50 w-64 flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-950/95 p-2 text-sm shadow-2xl shadow-black/60 backdrop-blur md:static md:flex md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-x-8 md:gap-y-3 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none`}
      >
        {children}
      </nav>
    </div>
  )
}

export function SiteNav() {
  const { ready, isTutor, name, userId } = useTutorSession()
  const isParent = Boolean(userId) && !isTutor

  if (!ready) {
    return <nav className="h-9" aria-hidden="true" />
  }

  if (isTutor) {
    return (
      <NavShell>
        <Link href="/tutors" className={linkClass} style={linkStyle}>
          <Search className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          Tutors
        </Link>
        <Link href="/profile" className={linkClass} style={linkStyle}>
          {name || 'My profile'}
        </Link>
      </NavShell>
    )
  }

  return (
    <NavShell>
      <Link href="/tutors" className={linkClass} style={linkStyle}>
        <Search className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        Find Tutors
      </Link>
      {isParent ? (
        <Link href="/account" className={linkClass} style={linkStyle}>
          My profile
        </Link>
      ) : (
        <Link href="/tutor-signup" className={linkClass} style={linkStyle}>
          <GraduationCap className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          Become a Tutor
        </Link>
      )}
      <Link href="/parent-signup" className={linkClass} style={linkStyle}>
        <UserPlus className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        Parent Sign Up
      </Link>
      <div className="mt-1 border-t border-neutral-800 px-3 pt-3 pb-1 md:mt-0 md:border-0 md:p-0">
        <AuthMenu />
      </div>
    </NavShell>
  )
}

export function ShowUnlessTutor({ children }: { children: React.ReactNode }) {
  const { ready, isTutor, userId } = useTutorSession()
  if (!ready || isTutor || userId) return null
  return <>{children}</>
}

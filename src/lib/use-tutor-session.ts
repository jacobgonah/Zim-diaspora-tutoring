'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const TUTOR_PROFILE_EVENT = 'zdt-tutor-profile'

export function notifyTutorProfile() {
  window.dispatchEvent(new Event(TUTOR_PROFILE_EVENT))
}

type TutorSession = {
  ready: boolean
  isTutor: boolean
  email: string | null
  name: string | null
  tutorId: string | null
  userId: string | null
}

const emptySession: TutorSession = {
  ready: false,
  isTutor: false,
  email: null,
  name: null,
  tutorId: null,
  userId: null,
}

function displayName(user: User, tutor: { title: string | null; surname: string | null } | null) {
  const fromProfile = [tutor?.title, tutor?.surname].filter(Boolean).join(' ')
  if (fromProfile) return fromProfile
  const meta = user.user_metadata ?? {}
  const first = typeof meta.first_name === 'string' ? meta.first_name.trim() : ''
  const surname = typeof meta.surname === 'string' ? meta.surname.trim() : ''
  return [first, surname].filter(Boolean).join(' ')
}

async function readViewer(user: User | null): Promise<TutorSession> {
  if (!user) {
    return { ...emptySession, ready: true }
  }
  const { data: tutor } = await supabase
    .from('tutors')
    .select('id, title, surname')
    .eq('user_id', user.id)
    .maybeSingle()
  const isTutor = user.user_metadata?.role === 'tutor' || !!tutor
  const name = displayName(user, tutor)
  return {
    ready: true,
    isTutor,
    email: user.email ?? null,
    name: name || null,
    tutorId: tutor?.id ?? null,
    userId: user.id,
  }
}

export function useTutorSession() {
  const [session, setSession] = useState<TutorSession>(emptySession)

  useEffect(() => {
    let cancelled = false
    async function load(user: User | null) {
      const next = await readViewer(user)
      if (!cancelled) setSession(next)
    }

    supabase.auth.getSession().then(({ data }) => {
      load(data.session?.user ?? null)
    })
    const { data: auth } = supabase.auth.onAuthStateChange((_event, next) => {
      load(next?.user ?? null)
    })
    const onProfile = () => {
      supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null))
    }
    window.addEventListener(TUTOR_PROFILE_EVENT, onProfile)
    return () => {
      cancelled = true
      auth.subscription.unsubscribe()
      window.removeEventListener(TUTOR_PROFILE_EVENT, onProfile)
    }
  }, [])

  return session
}

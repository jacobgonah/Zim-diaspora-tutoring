'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AUTH_NEXT_KEY, AUTH_ROLE_KEY, destinationFor, safeNext } from '@/lib/auth-redirect'
import { ResendConfirmation } from '@/components/ResendConfirmation'
import { useTutorSession } from '@/lib/use-tutor-session'

const fieldStyle = {
  backgroundColor: '#09090b',
  color: '#f5f5f5',
  WebkitTextFillColor: '#f5f5f5',
  forcedColorAdjust: 'none' as const,
  colorScheme: 'dark' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'transparent',
  color: '#d4d4d4',
  WebkitTextFillColor: '#d4d4d4',
  forcedColorAdjust: 'none' as const,
}

function ParentSignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { ready: tutorReady, isTutor } = useTutorSession()

  useEffect(() => {
    if (tutorReady && isTutor) router.replace('/profile')
  }, [tutorReady, isTutor, router])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedInEmail(data.session?.user.email ?? null)
    })
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }

    setLoading(true)
    sessionStorage.setItem(AUTH_ROLE_KEY, 'parent')
    if (next) sessionStorage.setItem(AUTH_NEXT_KEY, next)
    else sessionStorage.removeItem(AUTH_NEXT_KEY)

    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('role', 'parent')
    if (next) redirectTo.searchParams.set('next', next)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo.toString(),
        data: {
          role: 'parent',
          first_name: firstName.trim(),
          surname: surname.trim(),
          phone: phone.trim(),
        },
      },
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false)
      setError('An account with this email already exists. Log in instead.')
      return
    }

    if (data.session && data.user) {
      const { error: profileError } = await supabase.from('parents').upsert({
        user_id: data.user.id,
        first_name: firstName.trim(),
        surname: surname.trim(),
        phone: phone.trim() || null,
      })
      setLoading(false)
      if (profileError) {
        setError('Your account was created, but the profile was not saved. In the Supabase SQL editor, run the parents section of supabase/schema.sql, then log in again.')
        return
      }
      router.replace(destinationFor('parent', next))
      return
    }

    setLoading(false)
    setMessage('Check your email and confirm this account. After that, log in to book a lesson.')
  }

  if (!tutorReady) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: '#f5f5f5' }}>Checking your account...</p>
  }

  if (isTutor) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: '#f5f5f5' }}>Opening your profile...</p>
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10" style={{ color: '#f5f5f5' }}>
      <h1 className="text-center text-3xl font-bold tracking-tight" style={{ color: '#ffffff' }}>Parent Sign Up</h1>
      <div className="mx-auto mt-3 mb-4 h-1.5 w-20 rounded-full bg-amber-400" style={{ backgroundColor: '#FFD200' }} />
      <p className="mb-8 text-center leading-relaxed" style={{ color: '#d4d4d4' }}>
        Create a parent account to book a lesson. Browsing tutors stays open without an account.
      </p>
      {signedInEmail && (
        <p className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/60 px-4 py-3 text-sm" style={{ color: '#d4d4d4' }}>
          You are already signed in as {signedInEmail}.{' '}
          <Link href="/bookings" className="font-semibold text-amber-400 underline underline-offset-4 transition-colors hover:text-amber-300" style={{}}>My bookings</Link>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-neutral-800 border-t-4 border-t-amber-400 bg-neutral-900 p-6 shadow-2xl shadow-black/50 sm:p-8"
        style={{ backgroundColor: '#171717', color: '#f5f5f5', borderTop: '4px solid #FFD200' }}
      >
        <div>
          <label htmlFor="first-name" style={labelStyle}>First name</label>
          <input id="first-name" required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="surname" style={labelStyle}>Surname</label>
          <input id="surname" required autoComplete="family-name" value={surname} onChange={(event) => setSurname(event.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="phone" style={labelStyle}>Phone number (optional)</label>
          <input id="phone" type="tel" autoComplete="tel" placeholder="+263..." value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={fieldStyle} />
          <p className="mt-1.5 text-xs leading-5" style={{ color: '#a3a3a3', backgroundColor: 'transparent' }}>Saved for later. Used only after a tutor accepts a booking, to open WhatsApp.</p>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-400 py-3 font-bold text-neutral-950 shadow-lg shadow-amber-400/10 transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50" style={{ color: '#09090b' }}>
          {loading ? 'Creating account...' : 'Create parent account'}
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</p>}
      {message && (
        <>
          <p className="mt-4 rounded-lg border border-amber-500/40 bg-neutral-900 px-4 py-3 text-sm" style={{ color: '#f5f5f5' }}>{message}</p>
          <ResendConfirmation email={email.trim()} role="parent" />
        </>
      )}
      <p className="mt-6 text-center text-sm" style={{ color: '#a3a3a3' }}>
        Already have an account? <Link href={next ? `/login?role=parent&next=${encodeURIComponent(next)}` : '/login?role=parent'} className="font-semibold text-amber-400 underline underline-offset-4 transition-colors hover:text-amber-300" style={{}}>Log in</Link>
      </p>
    </div>
  )
}

export default function ParentSignUpPage() {
  return (
    <Suspense fallback={<p className="max-w-md mx-auto px-4 py-16" style={{ color: '#f5f5f5' }}>Loading parent sign up...</p>}>
      <ParentSignUpForm />
    </Suspense>
  )
}

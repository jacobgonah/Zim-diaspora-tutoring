'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AUTH_NEXT_KEY, AUTH_ROLE_KEY, destinationFor, safeNext } from '@/lib/auth-redirect'
import { ResendConfirmation } from '@/components/ResendConfirmation'

const fieldStyle = {
  backgroundColor: '#ffffff',
  color: '#111111',
  WebkitTextFillColor: '#111111',
  forcedColorAdjust: 'none' as const,
  colorScheme: 'light only' as const,
}

const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  backgroundColor: '#ffffff',
  color: '#111111',
  WebkitTextFillColor: '#111111',
  forcedColorAdjust: 'none' as const,
}

function TutorSignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      if (data.user) {
        router.replace(destinationFor('tutor', next))
        return
      }
      setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [router, next])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }

    setLoading(true)
    sessionStorage.setItem(AUTH_ROLE_KEY, 'tutor')
    if (next) sessionStorage.setItem(AUTH_NEXT_KEY, next)
    else sessionStorage.removeItem(AUTH_NEXT_KEY)

    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('role', 'tutor')
    if (next) redirectTo.searchParams.set('next', next)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo.toString(),
        data: {
          role: 'tutor',
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
      setLoading(false)
      router.replace(destinationFor('tutor', next))
      return
    }

    setLoading(false)
    setMessage('Check your email and confirm this account. After that, log in. The tutor profile form is available once you are signed in.')
  }

  if (checking) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: '#111111' }}>Loading tutor sign up...</p>
  }

  const loginHref = next ? `/login?role=tutor&next=${encodeURIComponent(next)}` : '/login?role=tutor'

  return (
    <div className="max-w-md mx-auto px-4 py-10" style={{ color: '#1a1a1a' }}>
      <h1 className="text-3xl font-bold" style={{ color: '#1a1a1a' }}>Tutor Sign Up</h1>
      <div className="mt-3 mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-6" style={{ color: '#111111' }}>
        Create a tutor account with your email and password. After you confirm the email and log in, you can add your subjects, levels, and the rest of your tutor profile.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg bg-white p-6 shadow"
        style={{ backgroundColor: '#ffffff', color: '#111111', borderTop: '4px solid #006400' }}
      >
        <div>
          <label htmlFor="first-name" style={labelStyle}>First name</label>
          <input id="first-name" required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="surname" style={labelStyle}>Surname</label>
          <input id="surname" required autoComplete="family-name" value={surname} onChange={(event) => setSurname(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="phone" style={labelStyle}>Phone number (optional)</label>
          <input id="phone" type="tel" autoComplete="tel" placeholder="+263..." value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
          <p className="mt-1 text-xs" style={{ color: '#3f3f46', backgroundColor: '#ffffff' }}>Saved on the account. The WhatsApp number parents use is added on the tutor profile after you log in.</p>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg py-3 font-medium disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
          {loading ? 'Creating account...' : 'Create tutor account'}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {message && (
        <>
          <p className="mt-4 text-sm" style={{ color: '#111111' }}>{message}</p>
          <ResendConfirmation email={email.trim()} role="tutor" />
        </>
      )}
      <p className="mt-4 text-sm" style={{ color: '#3f3f46' }}>
        Already have an account? <Link href={loginHref} className="underline" style={{ color: '#006400' }}>Log in</Link>
      </p>
    </div>
  )
}

export default function TutorSignUpPage() {
  return (
    <Suspense fallback={<p className="max-w-md mx-auto px-4 py-16" style={{ color: '#111111' }}>Loading tutor sign up...</p>}>
      <TutorSignUpForm />
    </Suspense>
  )
}

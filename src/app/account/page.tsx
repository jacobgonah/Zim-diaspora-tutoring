'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { missingColumn } from '@/lib/media-schema'
import { useTutorSession } from '@/lib/use-tutor-session'

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

const LOCATION_HINT = 'In the Supabase SQL editor, run: alter table public.parents add column if not exists location text; then save again.'

function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export default function ParentProfilePage() {
  const router = useRouter()
  const { ready, isTutor, userId } = useTutorSession()
  const [formReady, setFormReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (!ready) return
    if (!userId) {
      router.replace('/login?role=parent&next=/account')
      return
    }
    if (isTutor) {
      router.replace('/profile')
      return
    }

    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const user = data.session?.user
      if (!user) return
      const meta = user.user_metadata ?? {}
      const withLocation = await supabase
        .from('parents')
        .select('first_name, surname, phone, location')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return

      let row = withLocation.data
      if (withLocation.error && missingColumn(withLocation.error.message)) {
        const basic = await supabase
          .from('parents')
          .select('first_name, surname, phone')
          .eq('user_id', user.id)
          .maybeSingle()
        if (cancelled) return
        row = basic.data ? { ...basic.data, location: null } : null
      }

      setFirstName(textValue(row?.first_name) || textValue(meta.first_name))
      setSurname(textValue(row?.surname) || textValue(meta.surname))
      setPhone(textValue(row?.phone) || textValue(meta.phone))
      setLocation(textValue(row?.location) || textValue(meta.location))
      setFormReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [ready, isTutor, userId, router])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!userId) return
    setSaving(true)
    setError(null)
    setNotice(null)

    const profile = {
      user_id: userId,
      first_name: firstName.trim(),
      surname: surname.trim(),
      phone: phone.trim() || null,
      location: location.trim() || null,
    }
    let savedLocation = true
    let { error: profileError } = await supabase.from('parents').upsert(profile)
    if (profileError && missingColumn(profileError.message)) {
      savedLocation = false
      const retry = await supabase.from('parents').upsert({
        user_id: profile.user_id,
        first_name: profile.first_name,
        surname: profile.surname,
        phone: profile.phone,
      })
      profileError = retry.error
    }
    if (profileError) {
      setSaving(false)
      setError('Your profile could not be saved. In the Supabase SQL editor, run the parents section of supabase/schema.sql, then try again.')
      return
    }

    const { error: accountError } = await supabase.auth.updateUser({
      data: {
        role: 'parent',
        first_name: profile.first_name,
        surname: profile.surname,
        phone: profile.phone ?? '',
        location: location.trim(),
      },
    })
    setSaving(false)
    if (accountError) {
      setError('Your profile was saved, but the account name was not updated. Save again.')
      return
    }
    setNotice(savedLocation ? 'Profile saved.' : LOCATION_HINT)
  }

  if (!formReady) {
    return <p className="max-w-2xl mx-auto px-4 py-16" style={{ color: '#f5f5f5' }}>Checking your account...</p>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" style={{ color: '#f5f5f5' }}>
      <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>My profile</h1>
      <div className="mt-3 mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-6" style={{ color: '#d4d4d4' }}>
        These details stay on your parent account. They are separate from tutor sign-up.
      </p>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg bg-white p-6 shadow"
        style={{ backgroundColor: '#ffffff', color: '#111111', borderTop: '4px solid #006400' }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first-name" style={labelStyle}>First name</label>
            <input id="first-name" required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
          </div>
          <div>
            <label htmlFor="surname" style={labelStyle}>Surname</label>
            <input id="surname" required autoComplete="family-name" value={surname} onChange={(event) => setSurname(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
          </div>
        </div>
        <div>
          <label htmlFor="phone" style={labelStyle}>Phone number</label>
          <input id="phone" type="tel" autoComplete="tel" placeholder="+263..." value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="location" style={labelStyle}>Location</label>
          <input id="location" autoComplete="country-name" placeholder="City or country" value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-lg py-3 font-medium disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
      {error && <p className="mt-4 text-sm" style={{ color: '#d40000' }}>{error}</p>}
      {notice && <p className="mt-4 text-sm" style={{ color: '#f5f5f5' }}>{notice}</p>}
    </div>
  )
}

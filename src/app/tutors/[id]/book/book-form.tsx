'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

export default function BookForm({ tutorId }: { tutorId: string }) {
  const router = useRouter()
  const { ready: viewerReady, isTutor } = useTutorSession()
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    surname: '',
    parent_email: '',
    phone: '',
    slot_date: '',
    start_time: '',
    is_recurring: false,
  })

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const user = data.session?.user
      if (!user?.email) {
        router.replace(`/login?role=parent&next=/tutors/${tutorId}/book`)
        return
      }
      const { data: parent } = await supabase
        .from('parents')
        .select('first_name, surname, phone')
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return
      const meta = user.user_metadata ?? {}
      setUserId(user.id)
      setForm(current => ({
        ...current,
        parent_email: user.email as string,
        first_name: parent?.first_name || meta.first_name || '',
        surname: parent?.surname || meta.surname || '',
        phone: parent?.phone || meta.phone || '',
      }))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [tutorId, router])

  async function handleBook(event: React.FormEvent) {
    event.preventDefault()
    if (!userId) return
    setError(null)
    setLoading(true)

    const phone = form.phone.trim()
    const parentName = `${form.first_name.trim()} ${form.surname.trim()}`.trim()
    const { error: profileError } = await supabase.from('parents').upsert({
      user_id: userId,
      first_name: form.first_name.trim(),
      surname: form.surname.trim(),
      phone,
    })
    if (profileError) {
      setLoading(false)
      setError('Your parent profile could not be saved. Run the parents section of supabase/schema.sql, then try again.')
      return
    }

    const { error: bookingError } = await supabase.from('bookings').insert({
      tutor_id: tutorId,
      parent_user_id: userId,
      parent_email: form.parent_email,
      parent_name: parentName,
      parent_phone: phone,
      slot_date: form.slot_date,
      start_time: form.start_time,
      is_recurring: form.is_recurring,
      status: 'pending',
    })

    setLoading(false)
    if (bookingError) {
      const needsSetup = /parent_user_id|parent_phone|schema cache|column/i.test(bookingError.message)
      setError(needsSetup
        ? 'This booking could not be saved. Run the bookings section of supabase/schema.sql, then try again.'
        : bookingError.message)
      return
    }
    router.push('/bookings')
  }

  if (!ready) {
    return <p className="max-w-md mx-auto px-4 py-16" style={{ color: '#111111' }}>Checking your account...</p>
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8" style={{ color: '#1a1a1a' }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#006400' }}>Request a lesson time</h1>
      <div className="mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-4 text-sm" style={{ color: '#3f3f46' }}>
        This request is tied to your signed-in account. The tutor accepts it, then WhatsApp opens for both of you.
      </p>
      <form onSubmit={handleBook} className="space-y-4 bg-white p-6 rounded-lg shadow" style={{ backgroundColor: '#ffffff', color: '#111111', borderTop: '4px solid #ffd200' }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first-name" style={labelStyle}>First name</label>
            <input id="first-name" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full border rounded px-3 py-2" style={fieldStyle} />
          </div>
          <div>
            <label htmlFor="surname" style={labelStyle}>Surname</label>
            <input id="surname" required value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} className="w-full border rounded px-3 py-2" style={fieldStyle} />
          </div>
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>Account email</label>
          <input id="email" type="email" readOnly value={form.parent_email} className="w-full border rounded px-3 py-2" style={{ ...fieldStyle, backgroundColor: '#f4f4f5' }} />
        </div>
        <div>
          <label htmlFor="phone" style={labelStyle}>Your WhatsApp number</label>
          <input id="phone" type="tel" required placeholder="+263..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-3 py-2" style={fieldStyle} />
          <p className="mt-1 text-xs" style={{ color: '#3f3f46', backgroundColor: '#ffffff' }}>Not shown on any public page. The tutor gets a WhatsApp link to this number only after they accept.</p>
        </div>
        <div>
          <label htmlFor="date" style={labelStyle}>Date</label>
          <input id="date" type="date" required value={form.slot_date} onChange={e => setForm({ ...form, slot_date: e.target.value })} className="w-full border rounded px-3 py-2" style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="time" style={labelStyle}>Start time</label>
          <input id="time" type="time" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full border rounded px-3 py-2" style={fieldStyle} />
        </div>
        <label className="flex items-center gap-2" style={{ backgroundColor: '#ffffff', color: '#111111' }}>
          <input type="checkbox" checked={form.is_recurring} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} />
          Repeat weekly
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg py-3 font-medium disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
          {loading ? 'Sending request...' : 'Request this time'}
        </button>
      </form>
      <p className="text-xs mt-4" style={{ color: '#3f3f46' }}>
        The lesson and payment happen off this site.
        {viewerReady && !isTutor && (
          <> <Link href="/parent-signup" className="underline" style={{ color: '#006400' }}>Parent Sign Up</Link> collects your phone earlier if you prefer.</>
        )}
      </p>
    </div>
  )
}

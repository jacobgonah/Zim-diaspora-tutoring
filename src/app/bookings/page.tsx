'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { bookingRequestLabel, lessonWhen } from '@/lib/lesson-time'

type BookingRow = {
  id: string
  tutor_id: string
  parent_user_id: string | null
  parent_name: string | null
  slot_date: string
  start_time: string
  is_recurring: boolean
  status: string
  tutors: { title: string | null; surname: string } | null
}

const cardStyle = { backgroundColor: '#ffffff', color: '#111111' }

export default function BookingsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [viewerIsTutor, setViewerIsTutor] = useState(false)
  const [rows, setRows] = useState<BookingRow[]>([])
  const [links, setLinks] = useState<Record<string, string | null>>({})
  const [error, setError] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const user = data.session?.user
      if (!user) {
        router.replace('/login?role=parent&next=/bookings')
        return
      }
      setUserId(user.id)
      const { data: tutor } = await supabase.from('tutors').select('id').eq('user_id', user.id).maybeSingle()
      if (!cancelled) {
        setTutorId(tutor?.id ?? null)
        setViewerIsTutor(user.user_metadata?.role === 'tutor' || !!tutor)
      }
      const { data: bookings, error: loadError } = await supabase
        .from('bookings')
        .select('id, tutor_id, parent_user_id, parent_name, slot_date, start_time, is_recurring, status, tutors(title, surname)')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (loadError) {
        setError('Bookings could not be loaded. In the Supabase SQL editor, run the parents and bookings section of supabase/schema.sql, then refresh.')
      } else {
        setRows(((bookings ?? []) as Array<BookingRow & { tutors: BookingRow['tutors'] | BookingRow['tutors'][] }>).map((row) => ({
          ...row,
          tutors: Array.isArray(row.tutors) ? row.tutors[0] ?? null : row.tutors,
        })))
      }
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    const accepted = rows.filter((row) => row.status === 'accepted')
    if (accepted.length === 0) return
    let cancelled = false
    accepted.forEach(async (row) => {
      const { data } = await supabase.rpc('booking_whatsapp_link', { target_id: row.id })
      if (!cancelled) {
        setLinks((current) => ({ ...current, [row.id]: typeof data === 'string' ? data : null }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [rows])

  async function accept(id: string) {
    setAcceptingId(id)
    setError(null)
    const { error: acceptError } = await supabase.rpc('accept_booking', { target_id: id })
    if (acceptError) {
      setAcceptingId(null)
      setError(acceptError.message)
      return
    }
    setRows((current) => current.map((row) => row.id === id ? { ...row, status: 'accepted' } : row))
    const { data } = await supabase.rpc('booking_whatsapp_link', { target_id: id })
    setLinks((current) => ({ ...current, [id]: typeof data === 'string' ? data : null }))
    setAcceptingId(null)
  }

  if (!ready) {
    return <p className="max-w-3xl mx-auto px-4 py-16" style={{ color: '#f5f5f5' }}>Checking your account...</p>
  }

  const incoming = rows.filter((row) => tutorId !== null && row.tutor_id === tutorId)
  const outgoing = rows.filter((row) => row.parent_user_id === userId)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: '#f5f5f5' }}>
      <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>My bookings</h1>
      <div className="mt-3 mb-6 h-1.5 w-16 bg-zw-gold" />
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {tutorId && <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: '#ffffff' }}>Requests for you</h2>
        {incoming.length === 0 ? (
          <p style={{ color: '#a3a3a3' }}>No booking requests yet.</p>
        ) : (
          <ul className="space-y-3">
            {incoming.map((row) => (
              <li key={row.id} className="rounded-lg p-4 shadow" style={cardStyle}>
                <p className="font-medium">{bookingRequestLabel(row.slot_date, row.start_time)}</p>
                {row.parent_name && <p className="mt-1 text-sm" style={{ color: '#3f3f46' }}>From {row.parent_name}</p>}
                {row.status === 'pending' ? (
                  <button
                    type="button"
                    disabled={acceptingId === row.id}
                    onClick={() => accept(row.id)}
                    className="mt-3 rounded-lg px-4 py-2 font-medium disabled:opacity-50"
                    style={{ backgroundColor: '#006400', color: '#ffffff' }}
                  >
                    {acceptingId === row.id ? 'Accepting...' : 'Accept'}
                  </button>
                ) : (
                  <AcceptedLink link={links[row.id]} when={lessonWhen(row.slot_date, row.start_time)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>}

      {!viewerIsTutor && <section>
        <h2 className="text-xl font-semibold mb-3" style={{ color: '#ffffff' }}>Your lesson requests</h2>
        {outgoing.length === 0 ? (
          <p style={{ color: '#a3a3a3' }}>You have not requested a lesson yet. <Link href="/tutors" className="underline" style={{ color: '#FFD200' }}>Find Tutors</Link></p>
        ) : (
          <ul className="space-y-3">
            {outgoing.map((row) => {
              const tutorName = [row.tutors?.title, row.tutors?.surname].filter(Boolean).join(' ')
              return (
                <li key={row.id} className="rounded-lg p-4 shadow" style={cardStyle}>
                  <p className="font-medium">{lessonWhen(row.slot_date, row.start_time)}{tutorName ? ` with ${tutorName}` : ''}</p>
                  {row.status === 'pending' ? (
                    <p className="mt-2 text-sm" style={{ color: '#3f3f46' }}>Waiting for the tutor to accept.</p>
                  ) : (
                    <AcceptedLink link={links[row.id]} when={lessonWhen(row.slot_date, row.start_time)} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>}
    </div>
  )
}

function AcceptedLink({ link, when }: { link: string | null | undefined; when: string }) {
  if (link === undefined) {
    return <p className="mt-2 text-sm" style={{ color: '#3f3f46' }}>Preparing the WhatsApp link...</p>
  }
  if (!link) {
    return <p className="mt-2 text-sm" style={{ color: '#3f3f46' }}>Accepted. A WhatsApp link needs both phone numbers to be saved.</p>
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-block rounded-lg px-4 py-2 font-medium"
      style={{ backgroundColor: '#006400', color: '#ffffff' }}
    >
      Open WhatsApp about {when}
    </a>
  )
}

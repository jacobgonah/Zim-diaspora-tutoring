'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { supabase, PUBLIC_TUTOR_COLUMNS, type Tutor } from '@/lib/supabase'
import { TutorPhoto } from '@/components/TutorPhoto'
import { TutorStatus } from '@/components/TutorStatus'
import Link from 'next/link'
import { useTutorSession } from '@/lib/use-tutor-session'
import { TEACHING_LEVELS, teachingLevelLabel } from '@/lib/teaching-levels'
import { GENDERS } from '@/lib/gender'

import { missingColumn, missingRpc } from '@/lib/media-schema'
const LANGUAGES = ['English', 'English and Shona', 'English and Ndebele', 'English, Shona and Ndebele']
const lightControl: CSSProperties = { backgroundColor: '#09090b', color: '#f5f5f5', WebkitTextFillColor: '#f5f5f5', forcedColorAdjust: 'none', colorScheme: 'dark' }
const labelStyle: CSSProperties = { display: 'block', marginBottom: '4px', backgroundColor: 'transparent', color: '#d4d4d4', WebkitTextFillColor: '#d4d4d4', forcedColorAdjust: 'none', colorScheme: 'dark' }

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [language, setLanguage] = useState('')
  const [gender, setGender] = useState('')
  const { ready: viewerReady, isTutor, userId } = useTutorSession()

  useEffect(() => {
    let cancelled = false
    fetchTutors().then((result) => {
      if (cancelled) return
      setTutors(result.tutors)
      setLoadError(result.error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [subject, level, language, gender])

  async function fetchTutors() {
    setLoading(true)
    const rpc = await supabase.rpc('list_tutors', {
      p_subject: subject || null,
      p_level: level || null,
      p_language: language || null,
      p_gender: gender || null,
    })
    const fromRpc = tutorRows(rpc.data)
    if (!rpc.error && fromRpc) return { tutors: fromRpc, error: null }
    if (rpc.error && !missingRpc(rpc.error.message)) {
      return { tutors: [] as Tutor[], error: 'The tutor list could not be loaded. Check the Supabase project URL, then refresh.' }
    }

    let query = supabase
      .from('tutors')
      .select(PUBLIC_TUTOR_COLUMNS)
      .eq('is_live', true)
      .order('created_at', { ascending: false })

    if (subject) query = query.contains('subjects', [subject])
    if (level) query = query.contains('levels', [level])
    if (language) query = query.contains('languages', [language])
    if (gender) query = query.eq('gender', gender)

    const { data, error } = await query
    if (error || !data) {
      return {
        tutors: [] as Tutor[],
        error: error && missingColumn(error.message)
          ? 'In the Supabase SQL editor, run the media review section at the end of supabase/schema.sql, then refresh.'
          : 'The tutor list could not be loaded. Check the Supabase project URL, then refresh.',
      }
    }
    return { tutors: data, error: null }
  }

  return (
    <div style={{ color: '#f5f5f5' }}>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="mb-3 text-center text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#ffffff' }}>Find a Tutor</h1>
      <div className="mx-auto mb-8 h-1.5 w-20 rounded-full bg-amber-400" style={{ backgroundColor: '#FFD200' }} />

      <div className="sticky top-24 z-20 mb-8 grid grid-cols-1 gap-4 rounded-xl border border-neutral-800 border-t-4 border-t-emerald-600 bg-neutral-900/95 p-4 shadow-lg shadow-black/40 backdrop-blur-md md:grid-cols-2 xl:grid-cols-4" style={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', color: '#f5f5f5', forcedColorAdjust: 'none' }}>
        <div style={{ backgroundColor: 'transparent' }}>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Subject</label>
          <input
            type="text"
            placeholder="e.g. Mathematics, Science"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={lightControl}
          />
        </div>
        <div style={{ backgroundColor: 'transparent' }}>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={lightControl}>
            <option value="">Any</option>
            {TEACHING_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </div>
        <div style={{ backgroundColor: 'transparent' }}>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={lightControl}>
            <option value="">Any</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ backgroundColor: 'transparent' }}>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={labelStyle}>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400" style={lightControl}>
            <option value="">Any</option>
            {GENDERS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading tutors...</p>
      ) : loadError ? (
        <p className="rounded-xl border border-red-500/40 bg-neutral-900 px-4 py-3" style={{ color: '#fca5a5' }}>{loadError}</p>
      ) : tutors.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p style={{ color: '#a3a3a3' }}>No tutors match yet. Try adjusting your filters, or check back soon.</p>
          {viewerReady && !isTutor && !userId && (
            <Link href="/tutor-signup" className="mt-4 inline-block rounded-lg bg-amber-400 px-5 py-2 font-bold text-neutral-950 transition-colors hover:bg-amber-300" style={{ color: '#09090b' }}>Become a Tutor</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor) => (
            <Link key={tutor.id} href={`/tutors/${tutor.id}`} className="group block rounded-xl border border-neutral-800 border-b-4 border-b-amber-400 bg-neutral-900 p-5 shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:border-neutral-700 hover:border-b-amber-300 hover:shadow-black/60 focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ backgroundColor: '#171717', color: '#e5e5e5' }}>
              <div className="flex items-start gap-3">
                <TutorPhoto
                  photoUrl={tutor.photo_url}
                  gender={tutor.gender}
                  initial={tutor.surname?.[0] || '?'}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full text-xl ring-2 ring-emerald-800"
                />
                <div>
                  <h3 className="font-semibold transition-colors group-hover:text-amber-400" style={{}}>{[tutor.title, tutor.surname].filter(Boolean).join(' ')}</h3>
                  <div className="mt-1"><TutorStatus lastSeen={(tutor as Tutor & { last_seen?: string | null }).last_seen ?? null} /></div>
                  <p className="mt-1 inline-block rounded-full border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-400">{tutor.levels.map(teachingLevelLabel).join(', ')}</p>
                  <p className="mt-2 text-sm text-neutral-300">{tutor.subjects.slice(0, 3).join(', ')}{tutor.subjects.length > 3 ? '...' : ''}</p>
                  <p className="mt-1 text-xs text-neutral-500">{(tutor.languages || []).join(', ')}</p>
                  {tutor.no_show_count > 0 && (
                    <p className="mt-2 inline-block rounded-full border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-400">No-shows: {tutor.no_show_count}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}

function tutorRows(data: unknown): Tutor[] | null {
  const value = typeof data === 'string' ? parseJson(data) : data
  if (!Array.isArray(value)) return null
  return value.filter((item): item is Tutor => {
    if (!item || typeof item !== 'object') return false
    const row = item as Tutor
    return typeof row.id === 'string' && typeof row.surname === 'string' && Array.isArray(row.subjects) && Array.isArray(row.levels)
  })
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

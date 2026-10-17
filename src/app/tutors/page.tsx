'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { supabase, PUBLIC_TUTOR_COLUMNS, type Tutor } from '@/lib/supabase'
import { TutorPhoto } from '@/components/TutorPhoto'
import Link from 'next/link'
import { useTutorSession } from '@/lib/use-tutor-session'
import { TEACHING_LEVELS, teachingLevelLabel } from '@/lib/teaching-levels'
import { GENDERS } from '@/lib/gender'

import { missingColumn, missingRpc } from '@/lib/media-schema'
const LANGUAGES = ['English', 'English and Shona', 'English and Ndebele', 'English, Shona and Ndebele']
const lightControl: CSSProperties = { backgroundColor: '#ffffff', color: '#111111', WebkitTextFillColor: '#111111', forcedColorAdjust: 'none', colorScheme: 'light only' }
const labelStyle: CSSProperties = { display: 'block', marginBottom: '4px', backgroundColor: '#ffffff', color: '#111111', WebkitTextFillColor: '#111111', forcedColorAdjust: 'none', colorScheme: 'light only' }

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
    <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f7f4ea 420px)', color: '#1a1a1a' }}>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Find a Tutor</h1>
      <div className="mb-6 h-1.5 w-16 bg-zw-gold" />

      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 border-t-4 border-zw-green" style={{ backgroundColor: '#ffffff', color: '#111111', forcedColorAdjust: 'none' }}>
        <div style={{ backgroundColor: '#ffffff' }}>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Subject</label>
          <input
            type="text"
            placeholder="e.g. Mathematics, Science"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-zinc-300 rounded px-3 py-2 bg-white text-zinc-900 placeholder:text-zinc-500"
            style={lightControl}
          />
        </div>
        <div style={{ backgroundColor: '#ffffff' }}>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-2 bg-white text-zinc-900" style={lightControl}>
            <option value="">Any</option>
            {TEACHING_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </div>
        <div style={{ backgroundColor: '#ffffff' }}>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-2 bg-white text-zinc-900" style={lightControl}>
            <option value="">Any</option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ backgroundColor: '#ffffff' }}>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-zinc-300 rounded px-3 py-2 bg-white text-zinc-900" style={lightControl}>
            <option value="">Any</option>
            {GENDERS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading tutors...</p>
      ) : loadError ? (
        <p style={{ color: '#1a1a1a' }}>{loadError}</p>
      ) : tutors.length === 0 ? (
        <div>
          <p style={{ color: '#3f3f46' }}>No tutors match yet. Try adjusting your filters, or check back soon.</p>
          {viewerReady && !isTutor && !userId && (
            <Link href="/tutor-signup" className="mt-4 inline-block rounded-lg px-4 py-2 font-medium" style={{ backgroundColor: '#006400', color: '#ffffff' }}>Become a Tutor</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor) => (
            <Link key={tutor.id} href={`/tutors/${tutor.id}`} className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition border-b-4 border-zw-gold" style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}>
              <div className="flex items-start gap-3">
                <TutorPhoto
                  photoUrl={tutor.photo_url}
                  gender={tutor.gender}
                  initial={tutor.surname?.[0] || '?'}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full text-xl"
                />
                <div>
                  <h3 className="font-semibold" style={{ color: '#1a1a1a' }}>{[tutor.title, tutor.surname].filter(Boolean).join(' ')}</h3>
                  <p className="text-sm text-zinc-500">{tutor.levels.map(teachingLevelLabel).join(', ')}</p>
                  <p className="text-sm mt-1">{tutor.subjects.slice(0, 3).join(', ')}{tutor.subjects.length > 3 ? '...' : ''}</p>
                  <p className="text-xs text-zinc-400 mt-1">{(tutor.languages || []).join(', ')}</p>
                  {tutor.no_show_count > 0 && (
                    <p className="text-xs text-red-600 mt-1">No-shows: {tutor.no_show_count}</p>
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

'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const LEVELS = ['Primary', 'High School', 'Advanced Level']
const QUALIFICATIONS = ['Degree', 'Diploma', 'National Certificate']
const LANG_OPTIONS = ['English', 'English and Shona', 'English and Ndebele', 'English, Shona and Ndebele']
const fieldClass = 'w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600'
const lightControl: CSSProperties = { backgroundColor: '#ffffff', color: '#111111', borderColor: '#d4d4d8', WebkitTextFillColor: '#111111', forcedColorAdjust: 'none', colorScheme: 'light only' }
const labelStyle: CSSProperties = { display: 'block', marginBottom: '4px', backgroundColor: '#ffffff', color: '#111111', WebkitTextFillColor: '#111111', forcedColorAdjust: 'none', colorScheme: 'light only' }
const chipStyle = (selected: boolean) => selected
  ? { backgroundColor: '#006400', color: '#ffffff', borderColor: '#006400' }
  : lightControl
const DRAFT_KEY = 'zdt-tutor-draft'
const hintStyle = { color: '#3f3f46', backgroundColor: '#ffffff' }
const PHOTO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const VIDEO_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}
const PHOTO_BY_NAME: Record<string, string> = { jpg: 'jpg', jpeg: 'jpg', png: 'png', webp: 'webp' }
const VIDEO_BY_NAME: Record<string, string> = { mp4: 'mp4', webm: 'webm', mov: 'mov' }
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

function fileExt(file: File, byType: Record<string, string>, byName: Record<string, string>) {
  if (byType[file.type]) return byType[file.type]
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return byName[ext] || null
}
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 20 * 1024 * 1024
const MAX_VIDEO_SECONDS = 20

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = video.duration
      URL.revokeObjectURL(url)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    video.src = url
  })
}

function errorText(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Upload failed.'
}

async function uploadTutorFile(bucket: string, userId: string, file: File, ext: string) {
  const name = bucket === 'tutor-photos' ? 'photo' : 'intro'
  const path = `${userId}/${name}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || MIME_BY_EXT[ext],
    cacheControl: '3600',
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export default function BecomeTutorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoSeconds, setVideoSeconds] = useState<number | null>(null)
  const [videoChecking, setVideoChecking] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [mediaError, setMediaError] = useState('')
  const [form, setForm] = useState({
    title: 'Mr',
    surname: '',
    subjects: '',
    levels: [] as string[],
    languages: ['English'] as string[],
    qualifications: [] as string[],
    description: '',
    years_experience: '',
    whatsapp: '',
  })

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) {
      try {
        const saved = JSON.parse(raw)
        setForm(prev => ({
          ...prev,
          ...saved,
          levels: Array.isArray(saved.levels) ? saved.levels : prev.levels,
          languages: Array.isArray(saved.languages) ? saved.languages : prev.languages,
          qualifications: Array.isArray(saved.qualifications) ? saved.qualifications : prev.qualifications,
        }))
      } catch {
        sessionStorage.removeItem(DRAFT_KEY)
      }
    }

    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      if (data.user) {
        setUserId(data.user.id)
        setSignedInEmail(data.user.email ?? null)
      }
      setAuthReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    setPhotoError('')
    setMediaError('')
    if (!file) {
      setPhotoFile(null)
      return
    }
    if (!fileExt(file, PHOTO_EXT, PHOTO_BY_NAME)) {
      input.value = ''
      setPhotoFile(null)
      setPhotoError('Use a JPG, PNG, or WEBP photo.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      input.value = ''
      setPhotoFile(null)
      setPhotoError('Use a photo smaller than 5 MB.')
      return
    }
    setPhotoFile(file)
  }

  async function onVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    setVideoError('')
    setVideoSeconds(null)
    setMediaError('')
    if (!file) {
      setVideoFile(null)
      return
    }
    if (!fileExt(file, VIDEO_EXT, VIDEO_BY_NAME)) {
      input.value = ''
      setVideoFile(null)
      setVideoError('Use an MP4, WEBM, or MOV clip.')
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      input.value = ''
      setVideoFile(null)
      setVideoError('Use a clip smaller than 20 MB.')
      return
    }
    setVideoChecking(true)
    try {
      const duration = await readVideoDuration(file)
      if (Number.isFinite(duration) && duration > MAX_VIDEO_SECONDS) {
        input.value = ''
        setVideoFile(null)
        setVideoError('Use a clip of about 10–15 seconds (20 seconds at most).')
        return
      }
      setVideoFile(file)
      if (Number.isFinite(duration)) setVideoSeconds(Math.round(duration))
    } catch {
      setVideoFile(file)
    } finally {
      setVideoChecking(false)
    }
  }

  function toggleValue(key: 'levels' | 'languages' | 'qualifications', value: string) {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authReady) return
    if (!userId) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      router.push('/login?role=tutor&next=/become-tutor')
      return
    }
    if (videoChecking) return
    setLoading(true)
    setMediaError('')

    const subjectsArray = form.subjects.split(',').map(s => s.trim()).filter(Boolean)

    let photo_url: string | null = null
    let video_url: string | null = null
    try {
      if (photoFile) {
        const ext = fileExt(photoFile, PHOTO_EXT, PHOTO_BY_NAME)
        if (!ext) throw new Error('Use a JPG, PNG, or WEBP photo.')
        photo_url = await uploadTutorFile('tutor-photos', userId, photoFile, ext)
      }
      if (videoFile) {
        const ext = fileExt(videoFile, VIDEO_EXT, VIDEO_BY_NAME)
        if (!ext) throw new Error('Use an MP4, WEBM, or MOV clip.')
        video_url = await uploadTutorFile('tutor-videos', userId, videoFile, ext)
      }
    } catch (err) {
      setLoading(false)
      const message = errorText(err)
      const needsSetup = /bucket|row-level security|not found/i.test(message)
      setMediaError(needsSetup
        ? 'The photo or video could not be stored. In the Supabase SQL editor, run the tutor-photos and tutor-videos section of supabase/schema.sql, then try again.'
        : message)
      return
    }

    const { data: created, error } = await supabase.from('tutors').insert({
      user_id: userId,
      title: form.title,
      surname: form.surname,
      subjects: subjectsArray,
      levels: form.levels,
      languages: form.languages,
      qualifications: form.qualifications,
      description: form.description,
      years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      is_live: true, // free at launch
      ...(photo_url ? { photo_url } : {}),
      ...(video_url ? { video_url } : {}),
    }).select('id').single()

    if (!error && created && form.whatsapp.trim()) {
      const { error: contactError } = await supabase.from('tutor_contacts').upsert({
        tutor_id: created.id,
        whatsapp: form.whatsapp.trim(),
      })
      if (contactError) {
        setLoading(false)
        setMediaError('Your profile is live, but the private WhatsApp number was not saved. Run the tutor_contacts section of supabase/schema.sql, then submit again.')
        return
      }
    }

    if (error?.code === '23505' && form.whatsapp.trim()) {
      const { data: existing } = await supabase.from('tutors').select('id').eq('user_id', userId).single()
      if (existing) {
        await supabase.from('tutor_contacts').upsert({
          tutor_id: existing.id,
          whatsapp: form.whatsapp.trim(),
        })
      }
    }

    setLoading(false)
    if (error) {
      const alreadyExists = error.code === '23505'
      alert(alreadyExists ? 'You already have a tutor profile.' : 'Error creating profile: ' + error.message)
      if (alreadyExists) router.push('/tutors')
    } else {
      sessionStorage.removeItem(DRAFT_KEY)
      alert('Profile created and live! Booking requests appear under My bookings.')
      router.push('/tutors')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-zinc-900" style={{ backgroundColor: '#f7f4ea', color: '#1a1a1a' }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Become a Tutor</h1>
      <div className="mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-6" style={{ color: '#1a1a1a' }}>Create your free profile. It will go live immediately. No ID checks. Payment will be added later.</p>
      {signedInEmail ? (
        <p className="text-sm mb-4" style={{ color: '#111111' }}>Signed in as {signedInEmail}</p>
      ) : (
        <p className="text-sm mb-4" style={{ color: '#111111' }}>When you submit, you confirm your email, then this profile is created.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border-t-4 border-zw-red bg-white p-6 text-zinc-900 shadow" style={{ backgroundColor: '#ffffff', color: '#111111', forcedColorAdjust: 'none' }}>
        <div className="grid grid-cols-2 gap-4">
          <div style={{ backgroundColor: '#ffffff' }}>
            <label className="block text-sm font-medium" style={labelStyle}>Title</label>
            <select value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={fieldClass} style={lightControl}>
              <option>Mr</option>
              <option>Ms</option>
              <option>Mrs</option>
              <option>Dr</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium" style={labelStyle}>Surname *</label>
            <input required value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} className={fieldClass} style={lightControl} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium" style={labelStyle}>Subjects (comma separated) *</label>
          <input required placeholder="Mathematics, English, Shona" value={form.subjects} onChange={e => setForm({...form, subjects: e.target.value})} className={fieldClass} style={lightControl} />
        </div>

        <div>
          <label className="block text-sm font-medium" style={labelStyle}>Levels taught *</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {LEVELS.map(level => {
              const selected = form.levels.includes(level)
              return (
                <button
                  type="button"
                  key={level}
                  aria-pressed={selected}
                  onClick={() => toggleValue('levels', level)}
                  className="rounded border px-3 py-1"
                  style={chipStyle(selected)}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium" style={labelStyle}>Languages *</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {LANG_OPTIONS.map(language => {
              const selected = form.languages.includes(language)
              return (
                <button
                  type="button"
                  key={language}
                  aria-pressed={selected}
                  onClick={() => toggleValue('languages', language)}
                  className="rounded border px-3 py-1 text-left"
                  style={chipStyle(selected)}
                >
                  {language}
                </button>
              )
            })}
          </div>
          <p className="mt-1 text-xs">Must include English. Tap every language you teach.</p>
        </div>

        <div>
          <label className="block text-sm font-medium" style={labelStyle}>Held qualifications</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {QUALIFICATIONS.map(item => {
              const selected = form.qualifications.includes(item)
              return (
                <button
                  type="button"
                  key={item}
                  aria-pressed={selected}
                  onClick={() => toggleValue('qualifications', item)}
                  className="rounded border px-3 py-1"
                  style={chipStyle(selected)}
                >
                  {item}
                </button>
              )
            })}
          </div>
          <p className="mt-1 text-xs">Tap each one you hold: Degree, Diploma, or National Certificate.</p>
        </div>

        <div>
          <label className="block text-sm font-medium" style={labelStyle}>Years of experience</label>
          <input type="number" value={form.years_experience} onChange={e => setForm({...form, years_experience: e.target.value})} className={fieldClass} style={lightControl} />
        </div>

        <div>
          <label className="block text-sm font-medium" style={labelStyle}>WhatsApp number (private)</label>
          <input placeholder="+263..." value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className={fieldClass} style={lightControl} />
          <p className="mt-1 text-xs" style={hintStyle}>Not shown on your listing. After you accept a booking, this number opens a WhatsApp chat with the parent.</p>
        </div>

        <div>
          <label className="block text-sm font-medium" style={labelStyle}>Description / teaching style</label>
          <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={fieldClass} style={lightControl} />
        </div>

        <div>
          <label htmlFor="profile-photo" className="block text-sm font-medium" style={labelStyle}>Profile photo (optional)</label>
          <input
            id="profile-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPhotoChange}
            className={fieldClass}
            style={lightControl}
          />
          <p className="mt-1 text-xs" style={hintStyle}>Clear photo of your face, good lighting</p>
          {photoPreview && (
            <img src={photoPreview} alt="Selected profile photo" className="mt-2 h-16 w-16 rounded-full object-cover" />
          )}
          {photoError && <p className="mt-1 text-xs" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{photoError}</p>}
        </div>

        <div>
          <label htmlFor="intro-video" className="block text-sm font-medium" style={labelStyle}>Introduction video (optional)</label>
          <input
            id="intro-video"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={onVideoChange}
            className={fieldClass}
            style={lightControl}
          />
          <p className="mt-1 text-xs" style={hintStyle}>A short clip introducing yourself to parents. About 10–15 seconds.</p>
          {videoChecking && <p className="mt-1 text-xs" style={hintStyle}>Checking the clip...</p>}
          {videoSeconds !== null && <p className="mt-1 text-xs" style={hintStyle}>Selected clip: {videoSeconds} seconds.</p>}
          {videoError && <p className="mt-1 text-xs" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{videoError}</p>}
        </div>

        {!signedInEmail && authReady && (
          <p className="text-xs" style={hintStyle}>After you confirm your email, choose the photo and video again.</p>
        )}

        <p className="text-sm">A CV file upload will be added later. No ID documents are accepted.</p>

        {mediaError && <p className="text-sm" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{mediaError}</p>}

        <button type="submit" disabled={loading || !authReady || videoChecking} className="w-full rounded-lg bg-zw-green py-3 font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
          {loading ? 'Saving...' : 'Create Free Profile & Go Live'}
        </button>
      </form>
    </div>
  )
}

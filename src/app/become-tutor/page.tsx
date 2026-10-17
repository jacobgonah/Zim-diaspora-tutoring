'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ImagePlus, Video } from 'lucide-react'
import { supabase, PUBLIC_TUTOR_COLUMNS } from '@/lib/supabase'
import { notifyTutorProfile } from '@/lib/use-tutor-session'
import { TEACHING_LEVELS } from '@/lib/teaching-levels'
import { useRouter, usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const onProfile = pathname === '/profile'
  const [loading, setLoading] = useState(false)
  const [formReady, setFormReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [accountPhone, setAccountPhone] = useState('')
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null)
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
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
    let cancelled = false
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return
      const user = data.user
      if (!user) {
        router.replace(onProfile ? '/login?role=tutor&next=/profile' : '/tutor-signup?next=/profile')
        return
      }
      if (!onProfile) {
        router.replace('/profile')
        return
      }
      setUserId(user.id)
      setSignedInEmail(user.email ?? null)
      const meta = user.user_metadata ?? {}
      setFirstName(typeof meta.first_name === 'string' ? meta.first_name : '')
      setAccountPhone(typeof meta.phone === 'string' ? meta.phone : '')

      const { data: existing } = await supabase
        .from('tutors')
        .select(PUBLIC_TUTOR_COLUMNS)
        .eq('user_id', user.id)
        .maybeSingle()
      if (cancelled) return

      if (existing) {
        const { data: contact } = await supabase
          .from('tutor_contacts')
          .select('whatsapp')
          .eq('tutor_id', existing.id)
          .maybeSingle()
        if (cancelled) return
        setProfileId(existing.id)
        setSavedPhotoUrl(existing.photo_url ?? null)
        setSavedVideoUrl(existing.video_url ?? null)
        setPhotoPreview(existing.photo_url ?? null)
        setForm({
          title: existing.title || 'Mr',
          surname: existing.surname || '',
          subjects: (existing.subjects || []).join(', '),
          levels: existing.levels || [],
          languages: existing.languages?.length ? existing.languages : ['English'],
          qualifications: existing.qualifications || [],
          description: existing.description || '',
          years_experience: existing.years_experience != null ? String(existing.years_experience) : '',
          whatsapp: contact?.whatsapp || '',
        })
      } else {
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
        if (typeof meta.surname === 'string' && meta.surname) {
          setForm(prev => ({ ...prev, surname: prev.surname || meta.surname }))
        }
      }
      setFormReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [onProfile, router])

  useEffect(() => {
    if (!photoFile) return
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
      setPhotoPreview(savedPhotoUrl)
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
    if (!userId) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      router.push('/tutor-signup?next=/profile')
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

    const payload = {
      title: form.title,
      surname: form.surname,
      subjects: subjectsArray,
      levels: form.levels,
      languages: form.languages,
      qualifications: form.qualifications,
      description: form.description,
      years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      is_live: true,
      ...(photo_url ? { photo_url } : {}),
      ...(video_url ? { video_url } : {}),
    }

    let tutorId = profileId
    let error: { code?: string; message: string } | null = null
    if (profileId) {
      const updated = await supabase.from('tutors').update(payload).eq('id', profileId).eq('user_id', userId).select('id').single()
      error = updated.error
    } else {
      const created = await supabase.from('tutors').insert({ user_id: userId, ...payload }).select('id').single()
      error = created.error
      tutorId = created.data?.id ?? null
    }

    if (error?.code === '23505') {
      const { data: existing } = await supabase.from('tutors').select('id').eq('user_id', userId).maybeSingle()
      if (existing) {
        tutorId = existing.id
        const updated = await supabase.from('tutors').update(payload).eq('id', existing.id).eq('user_id', userId).select('id').single()
        error = updated.error
      }
    }

    if (!error && tutorId) {
      if (form.whatsapp.trim()) {
        const { error: contactError } = await supabase.from('tutor_contacts').upsert({
          tutor_id: tutorId,
          whatsapp: form.whatsapp.trim(),
        })
        if (contactError) {
          setProfileId(tutorId)
          setLoading(false)
          setMediaError('Your profile was saved, but the private WhatsApp number was not. Run the tutor_contacts section of supabase/schema.sql, then save again.')
          return
        }
      } else {
        const { error: deleteError } = await supabase.from('tutor_contacts').delete().eq('tutor_id', tutorId)
        if (deleteError) {
          setProfileId(tutorId)
          setLoading(false)
          setMediaError('Your profile was saved, but the private WhatsApp number could not be removed. Run the tutor_contacts section of supabase/schema.sql, then save again.')
          return
        }
      }
    }

    if (!error) {
      const { error: accountError } = await supabase.auth.updateUser({
        data: {
          role: 'tutor',
          first_name: firstName.trim(),
          surname: form.surname.trim(),
          phone: accountPhone.trim(),
        },
      })
      if (accountError) {
        if (tutorId) setProfileId(tutorId)
        setLoading(false)
        setMediaError('Your tutor listing was saved, but your name and phone were not updated. Save again.')
        notifyTutorProfile()
        return
      }
    }

    setLoading(false)
    if (error) {
      setMediaError('Error saving profile: ' + error.message)
      return
    }
    if (tutorId) setProfileId(tutorId)
    if (photo_url) setSavedPhotoUrl(photo_url)
    if (video_url) setSavedVideoUrl(video_url)
    setPhotoFile(null)
    setVideoFile(null)
    sessionStorage.removeItem(DRAFT_KEY)
    setNotice('Profile saved.')
    notifyTutorProfile()
  }

  if (!onProfile || !userId || !formReady) {
    return (
      <p className="max-w-2xl mx-auto px-4 py-16" style={{ color: '#111111' }}>Checking your account...</p>
    )
  }

  const displayName = [form.title, firstName, form.surname].filter(Boolean).join(' ')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-zinc-900" style={{ backgroundColor: '#f7f4ea', color: '#1a1a1a' }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>My profile</h1>
      <div className="mb-4 h-1.5 w-16 bg-zw-gold" />
      <p className="mb-4" style={{ color: '#1a1a1a' }}>
        {profileId
          ? 'Everything saved on your tutor profile is here. Change a field, or add anything that is still empty, then save.'
          : 'Add your tutor details below. They go on your public profile as soon as you save.'}
      </p>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link href="/bookings" className="font-bold underline" style={{ color: '#006400' }}>My bookings</Link>
        {profileId && (
          <Link href={`/tutors/${profileId}`} className="font-bold underline" style={{ color: '#006400' }}>View public profile</Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border-t-4 border-zw-green bg-white p-6 text-zinc-900 shadow" style={{ backgroundColor: '#ffffff', color: '#111111', forcedColorAdjust: 'none' }}>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <img src={photoPreview} alt="" className="h-20 w-20 rounded-full object-cover" style={{ border: '3px solid #ffd200' }} />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold" style={{ backgroundColor: '#ffd200', color: '#006400' }}>
              {(form.surname || firstName || '?')[0]}
            </div>
          )}
          <div>
            <p className="text-xl font-bold" style={{ color: '#1a1a1a' }}>{displayName || 'Your name'}</p>
            {signedInEmail && <p className="text-sm" style={{ color: '#3f3f46' }}>{signedInEmail}</p>}
            {form.subjects.trim() && <p className="text-sm" style={{ color: '#111111' }}>{form.subjects}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium" style={labelStyle}>First name</label>
            <input required value={firstName} onChange={e => setFirstName(e.target.value)} className={fieldClass} style={lightControl} />
          </div>
          <div>
            <label className="block text-sm font-medium" style={labelStyle}>Phone number (optional)</label>
            <input type="tel" placeholder="+263..." value={accountPhone} onChange={e => setAccountPhone(e.target.value)} className={fieldClass} style={lightControl} />
          </div>
        </div>

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
            {TEACHING_LEVELS.map(level => {
              const selected = form.levels.includes(level.value)
              return (
                <button
                  type="button"
                  key={level.value}
                  aria-pressed={selected}
                  onClick={() => toggleValue('levels', level.value)}
                  className="rounded border px-3 py-1"
                  style={chipStyle(selected)}
                >
                  {level.label}
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

        <div className="upload-grid">
          <div>
            <label htmlFor="profile-photo" className="upload-tile">
              <span className="upload-thumb">
                {photoPreview ? (
                  <img src={photoPreview} alt="" />
                ) : (
                  <>
                    <ImagePlus className="h-8 w-8" aria-hidden="true" />
                    <span>Upload</span>
                  </>
                )}
              </span>
              <span>
                <span className="upload-tile-title">{photoFile || savedPhotoUrl ? 'Click to change photo' : 'Click to upload a photo'}</span>
                <span className="upload-tile-hint">Optional. JPG, PNG, or WEBP. A clear photo of your face, under 5 MB.</span>
                {photoFile && <span className="upload-tile-file">{photoFile.name}</span>}
              </span>
              <input
                id="profile-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhotoChange}
              />
            </label>
            {photoError && <p className="mt-2 text-xs" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{photoError}</p>}
          </div>

          <div>
            <label htmlFor="intro-video" className="upload-tile">
              <span className="upload-thumb">
                <Video className="h-8 w-8" aria-hidden="true" />
                <span>{videoFile || savedVideoUrl ? 'Ready' : 'Upload'}</span>
              </span>
              <span>
                <span className="upload-tile-title">{videoFile || savedVideoUrl ? 'Click to change video' : 'Click to upload a video'}</span>
                <span className="upload-tile-hint">Optional. MP4, WEBM, or MOV. About 10–15 seconds, 20 seconds at most.</span>
                {videoChecking && <span className="upload-tile-file">Checking the clip...</span>}
                {videoFile && <span className="upload-tile-file">{videoFile.name}{videoSeconds !== null ? ` · ${videoSeconds} seconds` : ''}</span>}
              </span>
              <input
                id="intro-video"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={onVideoChange}
              />
            </label>
            {savedVideoUrl && !videoFile && (
              <video controls playsInline preload="metadata" src={savedVideoUrl} className="mt-2 w-full rounded-lg bg-black" />
            )}
            {videoError && <p className="mt-2 text-xs" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{videoError}</p>}
          </div>
        </div>

        <p className="text-sm">A CV file upload will be added later. No ID documents are accepted.</p>

        {mediaError && <p className="text-sm" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{mediaError}</p>}

        <button type="submit" disabled={loading || videoChecking} className="w-full rounded-lg bg-zw-green py-3 font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>
      {notice && <p className="mt-4 text-sm" style={{ color: '#111111' }}>{notice}</p>}
    </div>
  )
}

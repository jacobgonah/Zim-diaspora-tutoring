'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Folder, ImagePlus, Video } from 'lucide-react'
import { supabase, EDITOR_TUTOR_COLUMNS, PUBLIC_TUTOR_COLUMNS } from '@/lib/supabase'
import { notifyTutorProfile } from '@/lib/use-tutor-session'
import { TEACHING_LEVELS } from '@/lib/teaching-levels'
import { GENDERS, tutorGender } from '@/lib/gender'
import { qualificationChoices } from '@/lib/qualifications'
import { preparePortraitVideo } from '@/lib/portrait-video'
import { MEDIA_SCHEMA_HINT, mediaStatusNote, previewStoredMedia } from '@/lib/stored-media'
import { missingColumn, missingRpc } from '@/lib/media-schema'
import { TutorPhoto } from '@/components/TutorPhoto'
import { useRouter, usePathname } from 'next/navigation'
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

function errorText(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Upload failed.'
}

async function uploadTutorFile(bucket: string, userId: string, file: File, ext: string) {
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || MIME_BY_EXT[ext],
    cacheControl: '3600',
  })
  if (error) throw error
  return path
}

type EditorRow = {
  id: string
  title?: string | null
  surname?: string | null
  subjects?: string[] | null
  levels?: string[] | null
  languages?: string[] | null
  qualifications?: string[] | null
  qualification_detail?: string | null
  description?: string | null
  years_experience?: number | null
  gender?: string | null
  photo_url?: string | null
  video_url?: string | null
}

type OwnerMedia = {
  photo_path: string | null
  photo_status: string | null
  video_path: string | null
  video_status: string | null
}

async function ownerDisplays(profileId: string, media: OwnerMedia) {
  const photoDisplay = media.photo_status === 'approved'
    ? `/media/${profileId}/photo`
    : media.photo_path
      ? await previewStoredMedia('tutor-photos', media.photo_path)
      : null
  const videoDisplay = media.video_status === 'approved'
    ? `/media/${profileId}/video`
    : media.video_path
      ? await previewStoredMedia('tutor-videos', media.video_path)
      : null
  return { photoDisplay, videoDisplay }
}

function readMedia(value: unknown): OwnerMedia | null {
  if (!value || typeof value !== 'object') return null
  const media = value as Record<string, unknown>
  return {
    photo_path: typeof media.photo_path === 'string' ? media.photo_path : null,
    photo_status: typeof media.photo_status === 'string' ? media.photo_status : null,
    video_path: typeof media.video_path === 'string' ? media.video_path : null,
    video_status: typeof media.video_status === 'string' ? media.video_status : null,
  }
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
  const [notice, setNotice] = useState<string | null>(null)
  const [schemaNote, setSchemaNote] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [storedPhotoDisplay, setStoredPhotoDisplay] = useState<string | null>(null)
  const [photoStatus, setPhotoStatus] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [savedVideoPreview, setSavedVideoPreview] = useState<string | null>(null)
  const [videoSeconds, setVideoSeconds] = useState<number | null>(null)
  const [videoCropped, setVideoCropped] = useState(false)
  const [videoChecking, setVideoChecking] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [videoStatus, setVideoStatus] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState('')
  const [form, setForm] = useState({
    title: 'Mr',
    surname: '',
    gender: '' as '' | 'Male' | 'Female',
    subjects: '',
    levels: [] as string[],
    languages: ['English'] as string[],
    qualifications: [] as string[],
    qualification_detail: '',
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
      const metaGender = tutorGender(meta.gender) || ''
      setFirstName(typeof meta.first_name === 'string' ? meta.first_name : '')
      setAccountPhone(typeof meta.phone === 'string' ? meta.phone : '')

      const primary = await supabase
        .from('tutors')
        .select(EDITOR_TUTOR_COLUMNS)
        .eq('user_id', user.id)
        .maybeSingle()
      let existing: EditorRow | null = null
      let schemaReady = false
      if (!primary.error) {
        existing = primary.data
        schemaReady = true
      } else if (missingColumn(primary.error.message)) {
        setSchemaNote(MEDIA_SCHEMA_HINT)
        const fallback = await supabase
          .from('tutors')
          .select(PUBLIC_TUTOR_COLUMNS)
          .eq('user_id', user.id)
          .maybeSingle()
        if (!fallback.error) existing = fallback.data
      } else {
        setSchemaNote(primary.error.message)
      }
      if (cancelled) return

      if (existing) {
        const { data: contact } = await supabase
          .from('tutor_contacts')
          .select('whatsapp')
          .eq('tutor_id', existing.id)
          .maybeSingle()
        if (cancelled) return
        setProfileId(existing.id)
        setForm({
          title: existing.title || 'Mr',
          surname: existing.surname || '',
          gender: tutorGender(existing.gender) || metaGender,
          subjects: (existing.subjects || []).join(', '),
          levels: existing.levels || [],
          languages: existing.languages?.length ? existing.languages : ['English'],
          qualifications: existing.qualifications || [],
          qualification_detail: existing.qualification_detail || '',
          description: existing.description || '',
          years_experience: existing.years_experience != null ? String(existing.years_experience) : '',
          whatsapp: contact?.whatsapp || '',
        })
        if (schemaReady) {
          const mediaResult = await supabase.rpc('my_tutor_media')
          if (cancelled) return
          const media = mediaResult.error ? null : readMedia(mediaResult.data)
          if (mediaResult.error && missingRpc(mediaResult.error.message)) setSchemaNote(MEDIA_SCHEMA_HINT)
          if (media) {
            const displays = await ownerDisplays(existing.id, media)
            if (cancelled) return
            setPhotoStatus(media.photo_status)
            setVideoStatus(media.video_status)
            setStoredPhotoDisplay(displays.photoDisplay)
            setSavedVideoPreview(displays.videoDisplay)
          }
        } else {
          if (existing.photo_url) {
            setPhotoStatus('approved')
            setStoredPhotoDisplay(existing.photo_url)
          }
          if (existing.video_url) {
            setVideoStatus('approved')
            setSavedVideoPreview(existing.video_url)
          }
        }
      } else if (user.user_metadata?.role !== 'tutor') {
        router.replace('/account')
        return
      } else {
        const raw = sessionStorage.getItem(DRAFT_KEY)
        let draft: Record<string, unknown> = {}
        if (raw) {
          try {
            draft = JSON.parse(raw) as Record<string, unknown>
          } catch {
            sessionStorage.removeItem(DRAFT_KEY)
          }
        }
        const text = (value: unknown, fallback: string) => typeof value === 'string' ? value : fallback
        const list = (value: unknown, fallback: string[]) => Array.isArray(value)
          ? value.filter((item): item is string => typeof item === 'string')
          : fallback
        setForm(prev => ({
          title: text(draft.title, prev.title),
          surname: text(draft.surname, '') || prev.surname || (typeof meta.surname === 'string' ? meta.surname : ''),
          gender: tutorGender(draft.gender) || metaGender || prev.gender,
          subjects: text(draft.subjects, prev.subjects),
          levels: list(draft.levels, prev.levels),
          languages: list(draft.languages, prev.languages),
          qualifications: list(draft.qualifications, prev.qualifications),
          qualification_detail: text(draft.qualification_detail, prev.qualification_detail),
          description: text(draft.description, prev.description),
          years_experience: text(draft.years_experience, prev.years_experience),
          whatsapp: text(draft.whatsapp, prev.whatsapp),
        }))
      }
      setFormReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [onProfile, router])

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
      const prepared = await preparePortraitVideo(file)
      const url = URL.createObjectURL(prepared.file)
      setVideoPreview((current) => {
        if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
        return url
      })
      setVideoFile(prepared.file)
      setVideoSeconds(prepared.seconds)
      setVideoCropped(prepared.cropped)
    } catch (error) {
      input.value = ''
      setVideoFile(null)
      setVideoCropped(false)
      const message = error instanceof Error ? error.message : ''
      setVideoError(message === 'unreadable' ? 'Use an MP4, WEBM, or MOV clip.' : message || 'Use a vertical 9:16 video, filmed with your phone held upright.')
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
    if (form.gender !== 'Male' && form.gender !== 'Female') {
      setMediaError('Choose Male or Female.')
      return
    }
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
      gender: form.gender,
      subjects: subjectsArray,
      levels: form.levels,
      languages: form.languages,
      qualifications: form.qualifications,
      qualification_detail: form.qualification_detail.trim() || null,
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
          gender: form.gender,
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
      setMediaError(missingColumn(error.message) ? MEDIA_SCHEMA_HINT : 'Error saving profile: ' + error.message)
      return
    }
    if (tutorId) setProfileId(tutorId)
    if (photo_url && photoFile) {
      setPhotoStatus('pending')
      setStoredPhotoDisplay(URL.createObjectURL(photoFile))
    }
    if (video_url && videoPreview) {
      setVideoStatus('pending')
      setSavedVideoPreview((current) => {
        if (current?.startsWith('blob:') && current !== videoPreview) URL.revokeObjectURL(current)
        return videoPreview
      })
      setVideoPreview(null)
    }
    setPhotoFile(null)
    setVideoFile(null)
    setVideoCropped(false)
    sessionStorage.removeItem(DRAFT_KEY)
    setNotice(photo_url || video_url
      ? 'Profile saved. The new photo or video stays hidden until it is approved.'
      : 'Profile saved.')
    notifyTutorProfile()
  }

  if (!onProfile || !userId || !formReady) {
    return (
      <p className="max-w-2xl mx-auto px-4 py-16" style={{ color: '#f5f5f5' }}>Checking your account...</p>
    )
  }

  const displayName = [form.title, firstName, form.surname].filter(Boolean).join(' ')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" style={{ color: '#f5f5f5' }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>My profile</h1>
      <div className="mb-4 h-1.5 w-16 bg-amber-400" />
      <p className="mb-4" style={{ color: '#d4d4d4' }}>
        {profileId
          ? 'Everything saved on your tutor profile is here. Change a field, or add anything that is still empty, then save. A new photo or video stays hidden until it is approved.'
          : 'Add your tutor details below. Your subjects, levels, and description go on your public profile when you save. A photo or video stays hidden until it is approved.'}
      </p>
      {schemaNote && <p className="mb-4 text-sm" style={{ color: '#d40000' }}>{schemaNote}</p>}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link href="/bookings" className="font-bold underline" style={{ color: '#006400' }}>My bookings</Link>
        {profileId && (
          <Link href={`/tutors/${profileId}`} className="font-bold underline" style={{ color: '#006400' }}>View public profile</Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border-t-4 border-zw-green bg-white p-6 text-zinc-900 shadow" style={{ backgroundColor: '#ffffff', color: '#111111', forcedColorAdjust: 'none' }}>
        <div className="flex items-center gap-4">
          <TutorPhoto
            photoUrl={!photoFile && photoStatus === 'approved' ? storedPhotoDisplay : null}
            gender={form.gender}
            initial={(form.surname || firstName || '?')[0]}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full text-2xl"
          />
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

        <fieldset>
          <legend className="block text-sm font-medium" style={labelStyle}>Gender *</legend>
          <div className="mt-1 flex gap-4">
            {GENDERS.map((option) => (
              <label key={option} className="flex items-center gap-2" style={{ color: '#111111', backgroundColor: '#ffffff' }}>
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  required
                  checked={form.gender === option}
                  onChange={() => setForm({ ...form, gender: option })}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

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
            {qualificationChoices(form.qualifications).map(item => {
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
          <p className="mt-1 text-xs" style={hintStyle}>Tap each one you hold. Add the subject or institution below.</p>
          <label className="mt-3 block text-sm font-medium" style={labelStyle} htmlFor="qualification-detail">Subject or institution</label>
          <input
            id="qualification-detail"
            value={form.qualification_detail}
            onChange={e => setForm({ ...form, qualification_detail: e.target.value })}
            placeholder="For example, BSc Mathematics, University of Zimbabwe"
            className={fieldClass}
            style={lightControl}
          />
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
            <label htmlFor="profile-photo" className={photoFile || storedPhotoDisplay ? 'upload-attached' : 'upload-tile'}>
              {photoFile || storedPhotoDisplay ? (
                <>
                  <Folder className="h-8 w-8 shrink-0" aria-hidden="true" />
                  <span>{photoFile ? photoFile.name : 'Photo attached'}</span>
                </>
              ) : (
                <>
                  <span className="upload-thumb">
                    <ImagePlus className="h-8 w-8" aria-hidden="true" />
                    <span>Upload</span>
                  </span>
                  <span>
                    <span className="upload-tile-title">Click to upload a photo</span>
                    <span className="upload-tile-hint">Optional. JPG, PNG, or WEBP, under 5 MB. Parents see your gender icon until the photo is approved.</span>
                  </span>
                </>
              )}
              <input
                id="profile-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhotoChange}
              />
            </label>
            {photoError && <p className="mt-2 text-xs" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{photoError}</p>}
            {!photoFile && mediaStatusNote('photo', photoStatus) && (
              <p className="mt-2 text-xs" style={hintStyle}>{mediaStatusNote('photo', photoStatus)}</p>
            )}
            {photoFile && <p className="mt-2 text-xs" style={hintStyle}>Parents see your gender icon until this photo is approved.</p>}
          </div>

          <div>
            <label htmlFor="intro-video" className={videoFile || savedVideoPreview ? 'upload-attached' : 'upload-tile'}>
              {videoFile || savedVideoPreview ? (
                <>
                  <Folder className="h-8 w-8 shrink-0" aria-hidden="true" />
                  <span>
                    {videoFile
                      ? `${videoFile.name}${videoSeconds !== null ? ` · ${videoSeconds} seconds` : ''}${videoCropped ? ' · cropped to 9:16' : ''}`
                      : 'Video attached'}
                  </span>
                </>
              ) : (
                <>
                  <span className="upload-thumb">
                    <Video className="h-8 w-8" aria-hidden="true" />
                    <span>Upload</span>
                  </span>
                  <span>
                    <span className="upload-tile-title">Click to upload a video</span>
                    <span className="upload-tile-hint">Optional. Vertical 9:16, filmed with your phone held upright. About 10–15 seconds, 20 seconds at most. Wider clips are cropped when the browser can.</span>
                    {videoChecking && <span className="upload-tile-file">Checking the clip...</span>}
                  </span>
                </>
              )}
              <input
                id="intro-video"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={onVideoChange}
              />
            </label>
            {!videoFile && mediaStatusNote('video', videoStatus) && (
              <p className="mt-2 text-xs" style={hintStyle}>{mediaStatusNote('video', videoStatus)}</p>
            )}
            {videoFile && <p className="mt-2 text-xs" style={hintStyle}>This video stays off your public profile until it is approved.</p>}
            {videoError && <p className="mt-2 text-xs" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{videoError}</p>}
          </div>
        </div>

        <p className="text-sm">A CV file upload will be added later. No ID documents are accepted.</p>

        {mediaError && <p className="text-sm" style={{ color: '#d40000', backgroundColor: '#ffffff' }}>{mediaError}</p>}

        <button type="submit" disabled={loading || videoChecking} className="w-full rounded-lg bg-zw-green py-3 font-medium text-white disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>
      {notice && <p className="mt-4 text-sm" style={{ color: '#f5f5f5' }}>{notice}</p>}
    </div>
  )
}

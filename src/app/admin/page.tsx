'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { IntroVideo } from '@/components/IntroVideo'

const TOKEN_KEY = 'zdt-admin-token'
const fieldStyle = {
  backgroundColor: '#ffffff',
  color: '#111111',
  WebkitTextFillColor: '#111111',
  forcedColorAdjust: 'none' as const,
  colorScheme: 'light only' as const,
}

type PendingItem = {
  tutor_id: string
  title: string | null
  surname: string
  gender: string | null
  kind: 'photo' | 'video'
}

function isPendingItem(value: unknown): value is PendingItem {
  if (!value || typeof value !== 'object') return false
  const item = value as PendingItem
  return typeof item.tutor_id === 'string' && (item.kind === 'photo' || item.kind === 'video') && typeof item.surname === 'string'
}

export default function AdminPage() {
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [items, setItems] = useState<PendingItem[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY)
    setToken(saved)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    loadQueue(token).then((result) => {
      if (cancelled) return
      if (result.error) {
        if (/sign in again/i.test(result.error)) signOut()
        setError(result.error)
        setItems([])
        return
      }
      setItems(result.items)
      result.items.forEach((item) => {
        void loadPreview(token, item)
      })
    })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [previews])

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setItems([])
    setPassword('')
  }

  async function loadPreview(currentToken: string, item: PendingItem) {
    const key = `${item.tutor_id}:${item.kind}`
    const response = await fetch(`/api/admin-preview?tutor=${item.tutor_id}&kind=${item.kind}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    })
    if (!response.ok) return
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    setPreviews((current) => ({ ...current, [key]: url }))
  }

  async function signIn(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSigningIn(true)
    const { data, error: signInError } = await supabase.rpc('admin_sign_in', { p_password: password })
    setSigningIn(false)
    if (signInError || typeof data !== 'string' || !data) {
      setError(signInError?.message || 'That admin password is not correct.')
      return
    }
    sessionStorage.setItem(TOKEN_KEY, data)
    setToken(data)
    setPassword('')
  }

  async function review(item: PendingItem, decision: 'approved' | 'rejected') {
    if (!token) return
    setError(null)
    setNotice(null)
    const key = `${item.tutor_id}:${item.kind}:${decision}`
    setBusy(key)
    const { error: reviewError } = await supabase.rpc('admin_review_media', {
      p_token: token,
      p_tutor_id: item.tutor_id,
      p_kind: item.kind,
      p_decision: decision,
    })
    setBusy(null)
    if (reviewError) {
      if (/sign in again/i.test(reviewError.message)) signOut()
      setError(reviewError.message)
      return
    }
    setItems((current) => current.filter((row) => !(row.tutor_id === item.tutor_id && row.kind === item.kind)))
    setNotice(decision === 'approved' ? 'Approved. It is now on the public profile.' : 'Rejected. It stays off the public profile.')
  }

  if (!ready) {
    return <p className="max-w-3xl mx-auto px-4 py-16" style={{ color: '#f5f5f5' }}>Loading review...</p>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: '#f5f5f5' }}>
      <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>Review uploads</h1>
      <div className="mt-3 mb-6 h-1.5 w-16 bg-amber-400" />
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-4 text-sm" style={{ color: '#f5f5f5' }}>{notice}</p>}
      {!token ? (
        <form onSubmit={signIn} className="max-w-md space-y-4 rounded-lg bg-white p-6 shadow" style={{ backgroundColor: '#ffffff', color: '#111111', borderTop: '4px solid #006400' }}>
          <p style={{ color: '#111111' }}>This page is separate from tutor and parent sign-in.</p>
          <div>
            <label htmlFor="admin-password" style={{ display: 'block', marginBottom: '4px', color: '#111111' }}>Admin password</label>
            <input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded border border-zinc-300 px-3 py-2" style={fieldStyle} />
          </div>
          <button type="submit" disabled={signingIn} className="w-full rounded-lg py-3 font-medium disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
            {signingIn ? 'Checking...' : 'Open the queue'}
          </button>
        </form>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p style={{ color: '#d4d4d4' }}>Photos and videos waiting for a decision.</p>
            <button type="button" onClick={signOut} className="rounded-lg px-3 py-2 text-sm font-bold" style={{ color: '#006400' }}>Log out</button>
          </div>
          {items.length === 0 ? (
            <p style={{ color: '#3f3f46' }}>No photos or videos are waiting for review.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const key = `${item.tutor_id}:${item.kind}`
                const preview = previews[key]
                const name = [item.title, item.surname].filter(Boolean).join(' ')
                return (
                  <li key={key} className="rounded-lg bg-white p-4 shadow" style={{ backgroundColor: '#ffffff', color: '#111111' }}>
                    <p className="font-semibold" style={{ color: '#1a1a1a' }}>{name}</p>
                    <p className="text-sm" style={{ color: '#3f3f46' }}>{item.kind === 'photo' ? 'Profile photo' : 'Introduction video'}{item.gender ? ` · ${item.gender}` : ''}</p>
                    <div className="mt-3">
                      {!preview ? (
                        <p className="text-sm" style={{ color: '#3f3f46' }}>Loading preview...</p>
                      ) : item.kind === 'photo' ? (
                        <img src={preview} alt="" className="h-28 w-28 rounded-full object-cover" />
                      ) : (
                        <IntroVideo src={preview} />
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={busy !== null} onClick={() => review(item, 'approved')} className="rounded-lg px-4 py-2 font-medium disabled:opacity-50" style={{ backgroundColor: '#006400', color: '#ffffff' }}>
                        {busy === `${key}:approved` ? 'Approving...' : 'Approve'}
                      </button>
                      <button type="button" disabled={busy !== null} onClick={() => review(item, 'rejected')} className="rounded-lg px-4 py-2 font-medium disabled:opacity-50" style={{ backgroundColor: '#d40000', color: '#ffffff' }}>
                        {busy === `${key}:rejected` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

async function loadQueue(token: string) {
  const { data, error } = await supabase.rpc('admin_list_pending', { p_token: token })
  if (error) return { items: [] as PendingItem[], error: error.message }
  const parsed = typeof data === 'string' ? parseJson(data) : data
  const items = Array.isArray(parsed) ? parsed.filter(isPendingItem) : []
  return { items, error: null }
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

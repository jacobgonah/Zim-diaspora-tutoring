'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AuthRole } from '@/lib/auth-redirect'

export function ResendConfirmation({ email, role }: { email: string; role: AuthRole }) {
  const [sending, setSending] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resend() {
    setError(null)
    setNote(null)
    setSending(true)
    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('role', role)
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo.toString() },
    })
    setSending(false)
    if (resendError) {
      setError(resendError.message)
      return
    }
    setNote(`Confirmation email sent again to ${email}.`)
  }

  return (
    <div className="mt-4 rounded-lg bg-white p-4 shadow" style={{ backgroundColor: '#ffffff', color: '#111111', borderTop: '4px solid #006400' }}>
      <p className="text-sm" style={{ color: '#111111' }}>
        If the confirmation email did not arrive, send it again.
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={sending}
        className="mt-3 w-full rounded-lg py-3 font-medium disabled:opacity-50"
        style={{ backgroundColor: '#006400', color: '#ffffff' }}
      >
        {sending ? 'Sending...' : 'Resend confirmation email'}
      </button>
      {note && <p className="mt-3 text-sm" style={{ color: '#111111' }}>{note}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  )
}

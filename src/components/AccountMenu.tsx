'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTutorSession } from '@/lib/use-tutor-session'

export function AccountMenu() {
  const router = useRouter()
  const { ready, email } = useTutorSession()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    setOpen(false)
    setConfirmingDelete(false)
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    function onPointer(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  if (!ready || !email) return null

  async function logOut() {
    await supabase.auth.signOut()
    close()
    router.replace('/')
  }

  async function deleteAccount() {
    setError(null)
    setDeleting(true)
    const { error: deleteError } = await supabase.rpc('delete_own_account')
    if (deleteError) {
      setDeleting(false)
      const needsSetup = /delete_own_account|schema cache|could not find the function|PGRST202/i.test(deleteError.message)
      setError(needsSetup
        ? 'Account deletion is not set up yet. In the Supabase SQL editor, run the delete account section of supabase/schema.sql, then try again.'
        : deleteError.message)
      return
    }
    await supabase.auth.signOut({ scope: 'local' })
    close()
    router.replace('/')
  }

  return (
    <div ref={panelRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="account-menu"
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold"
        style={{ borderColor: '#006400', backgroundColor: '#ffffff', color: '#006400' }}
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        Menu
      </button>
      {open && (
        <div
          id="account-menu"
          role="menu"
          className="absolute left-0 top-full z-30 mt-2 w-72 rounded-lg border p-3 shadow-lg"
          style={{ backgroundColor: '#ffffff', color: '#111111', borderColor: '#d4d4d8' }}
        >
          <p className="break-all px-2 py-2 text-sm" style={{ color: '#3f3f46' }}>{email}</p>
          <button
            type="button"
            role="menuitem"
            onClick={logOut}
            disabled={deleting}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-bold disabled:opacity-50"
            style={{ color: '#006400' }}
          >
            Log out
          </button>
          {!confirmingDelete ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setError(null)
                setConfirmingDelete(true)
              }}
              disabled={deleting}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-bold disabled:opacity-50"
              style={{ color: '#d40000' }}
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-2 space-y-2 rounded-lg p-2" style={{ backgroundColor: '#fff5f5' }}>
              <p className="px-1 text-sm" style={{ color: '#111111' }}>
                Delete {email} now? This cannot be undone.
              </p>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
                className="w-full rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: '#d40000', color: '#ffffff' }}
              >
                {deleting ? 'Deleting...' : 'Delete this account'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="w-full rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: '#ffffff', color: '#111111', border: '1px solid #d4d4d8' }}
              >
                Cancel
              </button>
            </div>
          )}
          {error && <p className="mt-2 px-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  )
}

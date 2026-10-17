import { connection } from 'next/server'
import { supabase } from '@/lib/supabase'
import { streamStoredObject } from '@/lib/stream-storage'

export async function GET(request: Request) {
  await connection()
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const url = new URL(request.url)
  const tutor = url.searchParams.get('tutor')
  const kind = url.searchParams.get('kind')
  if (!token || !tutor || (kind !== 'photo' && kind !== 'video')) return new Response('Not found', { status: 404 })
  const { data, error } = await supabase.rpc('admin_media_object', {
    p_token: token,
    p_tutor_id: tutor,
    p_kind: kind,
  })
  if (error || !data || typeof data !== 'object') return new Response('Not found', { status: error ? 401 : 404 })
  const record = data as { bucket?: string; object_name?: string }
  if (!record.bucket || !record.object_name) return new Response('Not found', { status: 404 })
  return streamStoredObject(record.bucket, record.object_name, request, 'private, no-store')
}

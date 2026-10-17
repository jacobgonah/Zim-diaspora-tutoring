import { connection } from 'next/server'
import { supabase } from '@/lib/supabase'
import { streamStoredObject } from '@/lib/stream-storage'

export async function GET(request: Request, context: { params: Promise<{ id: string; kind: string }> }) {
  await connection()
  const { id, kind } = await context.params
  if (kind !== 'photo' && kind !== 'video') return new Response('Not found', { status: 404 })
  const { data, error } = await supabase.rpc('approved_media_path', { p_tutor_id: id, p_kind: kind })
  if (error || typeof data !== 'string' || !data) return new Response('Not found', { status: 404 })
  return streamStoredObject(kind === 'photo' ? 'tutor-photos' : 'tutor-videos', data, request, 'public, max-age=3600')
}

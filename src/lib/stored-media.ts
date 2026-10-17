import { supabase } from '@/lib/supabase'

export function storageObjectName(value: string, bucket: string) {
  const publicMarker = `/object/public/${bucket}/`
  const privateMarker = `/object/authenticated/${bucket}/`
  const publicAt = value.indexOf(publicMarker)
  if (publicAt >= 0) return decodeURIComponent(value.slice(publicAt + publicMarker.length).split('?')[0])
  const privateAt = value.indexOf(privateMarker)
  if (privateAt >= 0) return decodeURIComponent(value.slice(privateAt + privateMarker.length).split('?')[0])
  if (!value.includes('://') && !value.startsWith('/media/')) return value.split('?')[0]
  return null
}

export async function previewStoredMedia(bucket: 'tutor-photos' | 'tutor-videos', stored: string) {
  if (stored.startsWith('http') || stored.startsWith('/media/')) {
    const objectName = storageObjectName(stored, bucket)
    if (!objectName) return stored
    const downloaded = await supabase.storage.from(bucket).download(objectName)
    if (!downloaded.error && downloaded.data) return URL.createObjectURL(downloaded.data)
    return stored.startsWith('http') ? stored : null
  }
  const downloaded = await supabase.storage.from(bucket).download(stored)
  if (downloaded.error || !downloaded.data) return null
  return URL.createObjectURL(downloaded.data)
}

export function mediaStatusNote(kind: 'photo' | 'video', status: string | null) {
  if (status === 'pending') {
    return kind === 'photo'
      ? 'This photo is waiting for approval. Parents see your gender icon until then.'
      : 'This video is waiting for approval. It stays off your public profile until then.'
  }
  if (status === 'rejected') {
    return kind === 'photo'
      ? 'This photo was not approved. Upload a different one if you want a picture on your profile.'
      : 'This video was not approved. Upload a different vertical clip if you want an introduction on your profile.'
  }
  return null
}

export const MEDIA_SCHEMA_HINT = 'In the Supabase SQL editor, run the media review section at the end of supabase/schema.sql, then save again.'

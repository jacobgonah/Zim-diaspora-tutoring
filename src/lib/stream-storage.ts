import { storageObjectName } from '@/lib/stored-media'

function storageUrl(bucket: string, objectName: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const encoded = objectName.split('/').map((part) => encodeURIComponent(part)).join('/')
  return `${base}/storage/v1/object/authenticated/${bucket}/${encoded}`
}

export async function streamStoredObject(bucket: string, storedOrName: string, request: Request, cacheControl: string) {
  const objectName = storageObjectName(storedOrName, bucket)
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!objectName || !key) return new Response('Not found', { status: 404 })
  const headers = new Headers({
    apikey: key,
    Authorization: `Bearer ${key}`,
  })
  const range = request.headers.get('range')
  if (range) headers.set('Range', range)
  const upstream = await fetch(storageUrl(bucket, objectName), { headers })
  if (!upstream.ok && upstream.status !== 206) return new Response('Not found', { status: 404 })
  const responseHeaders = new Headers()
  responseHeaders.set('Content-Type', upstream.headers.get('content-type') || contentType(objectName))
  responseHeaders.set('Accept-Ranges', 'bytes')
  responseHeaders.set('Cache-Control', cacheControl)
  const length = upstream.headers.get('content-length')
  if (length) responseHeaders.set('Content-Length', length)
  const contentRange = upstream.headers.get('content-range')
  if (contentRange) responseHeaders.set('Content-Range', contentRange)
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}

function contentType(objectName: string) {
  const ext = objectName.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'mp4') return 'video/mp4'
  if (ext === 'webm') return 'video/webm'
  if (ext === 'mov') return 'video/quicktime'
  return 'image/jpeg'
}

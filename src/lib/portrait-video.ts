const TARGET = 9 / 16

export function portraitCrop(width: number, height: number) {
  if (!(width > 0) || !(height > 0)) return null
  const ratio = width / height
  if (ratio >= 0.45 && ratio <= 0.65) return null
  if (ratio > TARGET) {
    const sw = Math.max(1, Math.round(height * TARGET))
    return { sx: Math.max(0, Math.round((width - sw) / 2)), sy: 0, sw, sh: height }
  }
  const sh = Math.max(1, Math.round(width / TARGET))
  return { sx: 0, sy: Math.max(0, Math.round((height - sh) / 2)), sw: width, sh }
}

function loadVideo(file: File) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => resolve(video)
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    video.src = url
  })
}

async function cropToPortrait(video: HTMLVideoElement, width: number, height: number) {
  const crop = portraitCrop(width, height)
  if (!crop) throw new Error('already portrait')
  const outW = Math.min(crop.sw, 720)
  const outH = Math.max(1, Math.round(outW / TARGET))
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const context = canvas.getContext('2d')
  if (!context || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
    throw new Error('crop unsupported')
  }
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : ''
  if (!mimeType) throw new Error('crop unsupported')
  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_200_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data)
  }
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })
  recorder.start(200)
  await video.play()
  await new Promise<void>((resolve, reject) => {
    let frame = 0
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const fail = () => {
      if (settled) return
      settled = true
      reject(new Error('crop failed'))
    }
    const draw = () => {
      if (settled || video.ended) return
      context.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outW, outH)
      frame += 1
      requestAnimationFrame(draw)
    }
    video.onended = finish
    video.onerror = fail
    draw()
    window.setTimeout(() => {
      if (frame === 0) fail()
    }, 1500)
  })
  if (recorder.state !== 'inactive') recorder.stop()
  await stopped
  stream.getTracks().forEach((track) => track.stop())
  const blob = new Blob(chunks, { type: 'video/webm' })
  if (!blob.size) throw new Error('crop failed')
  return new File([blob], 'introduction.webm', { type: 'video/webm' })
}

export async function preparePortraitVideo(file: File) {
  const video = await loadVideo(file)
  const url = video.src
  try {
    const seconds = Number.isFinite(video.duration) ? video.duration : 0
    if (seconds > 20) {
      throw new Error('Use a clip of about 10–15 seconds (20 seconds at most).')
    }
    const crop = portraitCrop(video.videoWidth, video.videoHeight)
    if (!crop) {
      return { file, seconds: seconds ? Math.round(seconds) : null, cropped: false }
    }
    try {
      const portrait = await cropToPortrait(video, video.videoWidth, video.videoHeight)
      if (portrait.size > 20 * 1024 * 1024) {
        throw new Error('The cropped clip is larger than 20 MB. Use a shorter video.')
      }
      return { file: portrait, seconds: seconds ? Math.round(seconds) : null, cropped: true }
    } catch (error) {
      if (error instanceof Error && /20 MB|10–15 seconds/.test(error.message)) throw error
      throw new Error('Use a vertical 9:16 video, filmed with your phone held upright.')
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

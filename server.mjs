
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import dns from 'node:dns/promises'
import net from 'node:net'

const app = express()
const port = process.env.PORT || 3001
const root = path.dirname(fileURLToPath(import.meta.url))

app.use(express.json({ limit: '10kb' }))

// Supported social-media hosts
const supportedHosts = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
  'instagram.com',
  'www.instagram.com',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'fb.watch',
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com'
])

function isSupportedUrl(value) {
  try {
    const parsed = new URL(value)
    return (
      parsed.protocol === 'https:' &&
      !parsed.username &&
      !parsed.password &&
      supportedHosts.has(parsed.hostname.toLowerCase())
    )
  } catch {
    return false
  }
}

function isTikTokUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return [
      'tiktok.com',
      'www.tiktok.com',
      'm.tiktok.com',
      'vm.tiktok.com',
      'vt.tiktok.com'
    ].includes(host)
  } catch {
    return false
  }
}

// Avoid proxying requests to local/private network addresses.
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(n => n < 0 || n > 255)) {
    return true
  }

  const [a, b] = parts

  return (
    a === 0 || a === 10 || a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19))
  )
}

function isPrivateIPv6(ip) {
  const address = ip.toLowerCase()
  return (
    address === '::' ||
    address === '::1' ||
    address.startsWith('fc') ||
    address.startsWith('fd') ||
    /^fe[89ab]/.test(address) ||
    address.startsWith('::ffff:')
  )
}

async function isPublicHttpsUrl(value) {
  try {
    const url = new URL(value)

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !url.hostname
    ) {
      return false
    }

    const host = url.hostname.toLowerCase()

    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local')
    ) {
      return false
    }

    const ipVersion = net.isIP(host)

    if (ipVersion === 4) return !isPrivateIPv4(host)
    if (ipVersion === 6) return !isPrivateIPv6(host)

    const records = await dns.lookup(host, { all: true })

    return records.length > 0 && records.every(record => {
      if (record.family === 4) return !isPrivateIPv4(record.address)
      if (record.family === 6) return !isPrivateIPv6(record.address)
      return false
    })
  } catch {
    return false
  }
}

// TikTok resolver
async function resolveTikTok(url, quality, mode) {
  const endpoint = new URL('https://www.tikwm.com/api/')
  endpoint.searchParams.set('url', url)
  endpoint.searchParams.set('hd', '1')

  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'TikClip/1.0' },
    signal: AbortSignal.timeout(20000)
  })

  if (!res.ok) {
    throw new Error(`TikTok resolver returned HTTP ${res.status}`)
  }

  const result = await res.json()
  const data = result?.data

  if (!data || result.code !== 0) {
    throw new Error('TikTok could not provide this media.')
  }

  const mediaUrl = mode === 'audio'
    ? data.music
    : quality === 'standard'
      ? data.play
      : data.hdplay || data.play

  if (!mediaUrl || !await isPublicHttpsUrl(mediaUrl)) {
    throw new Error('TikTok did not return a valid media URL.')
  }

  return {
    url: mediaUrl,
    filename: `tikclip-${mode}.${mode === 'audio' ? 'mp3' : 'mp4'}`
  }
}

// Cobalt resolver
async function resolveCobalt(url, quality, mode) {
  // Configure COBALT_API_URL to an instance you own
  // or an instance whose owner has authorized your application.
  const base = process.env.COBALT_API_URL

  if (!base) {
    throw new Error(
      'Cobalt is not configured. Set COBALT_API_URL to an authorized Cobalt instance.'
    )
  }

  const endpoint = new URL(base)

  if (endpoint.protocol !== 'https:') {
    throw new Error('COBALT_API_URL must use HTTPS.')
  }

  // Current Cobalt API documentation uses POST /.
  endpoint.pathname = '/'
  endpoint.search = ''
  endpoint.hash = ''

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }

  if (process.env.COBALT_API_KEY) {
    headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url,
      videoQuality:
        quality === 'max' ? 'max' :
        quality === 'standard' ? '480' : '720',
      downloadMode: mode === 'audio' ? 'audio' : 'auto',
      audioFormat: 'mp3'
    }),
    signal: AbortSignal.timeout(30000)
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.status === 'error') {
    throw new Error(
      data?.error?.code ||
      data?.error?.message ||
      data?.text ||
      `Cobalt returned HTTP ${res.status}`
    )
  }

  let mediaUrl = ''

  if (['tunnel', 'redirect'].includes(data.status)) {
    mediaUrl = data.url
  } else if (data.status === 'picker' && data.picker?.length) {
    mediaUrl = data.picker[0].url
  }

  if (!mediaUrl || !await isPublicHttpsUrl(mediaUrl)) {
    throw new Error(
      'No valid downloadable URL was returned. This service may require additional processing.'
    )
  }

  return {
    url: mediaUrl,
    filename: data.filename ||
      `tikclip-${mode}.${mode === 'audio' ? 'mp3' : 'mp4'}`
  }
}

// Download resolution
app.post('/api/download', async (request, response) => {
  const url = typeof request.body?.url === 'string'
    ? request.body.url.trim()
    : ''

  const mode = request.body?.mode === 'audio' ? 'audio' : 'video'
  const quality = ['standard', 'hd', 'max'].includes(request.body?.quality)
    ? request.body.quality
    : 'hd'

  if (!url || !isSupportedUrl(url)) {
    return response.status(400).json({
      error: 'Please enter a valid HTTPS link from a supported platform.'
    })
  }

  try {
    let media

    if (isTikTokUrl(url)) {
      try {
        media = await resolveTikTok(url, quality, mode)
      } catch (error) {
        console.warn('TikTok resolver failed:', error.message)
      }
    }

    if (!media) {
      media = await resolveCobalt(url, quality, mode)
    }

    const downloadUrl = new URL('/api/media', request.protocol + '://' + request.get('host'))
    downloadUrl.searchParams.set('source', media.url)
    downloadUrl.searchParams.set('type', mode)

    return response.json({
      downloadUrl: downloadUrl.pathname + downloadUrl.search,
      filename: media.filename
    })
  } catch (error) {
    console.error('Download resolution failed:', error.message)

    return response.status(502).json({
      error: error.message || 'Could not resolve this media link.'
    })
  }
})

// Stream the resolved media to the user
app.get('/api/media', async (request, response) => {
  const source = typeof request.query.source === 'string'
    ? request.query.source
    : ''

  const type = request.query.type === 'audio' ? 'audio' : 'video'

  if (!source || !await isPublicHttpsUrl(source)) {
    return response.status(400).json({
      error: 'Invalid media URL.'
    })
  }

  try {
    const media = await fetch(source, {
      headers: { 'User-Agent': 'Mozilla/5.0 TikClip/1.0' },
      signal: AbortSignal.timeout(60000),
      redirect: 'error'
    })

    if (!media.ok || !media.body) {
      return response.status(502).json({
        error: `Media server returned HTTP ${media.status}.`
      })
    }

    response.setHeader(
      'Content-Type',
      type === 'audio' ? 'audio/mpeg' : 'video/mp4'
    )

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="tikclip-${type}.${type === 'audio' ? 'mp3' : 'mp4'}"`
    )

    const length = media.headers.get('content-length')
    if (length) response.setHeader('Content-Length', length)

    await pipeline(Readable.fromWeb(media.body), response)
  } catch (error) {
    if (!response.headersSent) {
      response.status(502).json({
        error: 'Could not stream the media. Please try another link.'
      })
    } else {
      response.destroy(error)
    }
  }
})

// Serve the frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')))

  app.use((_request, response) => {
    response.sendFile(path.join(root, 'dist', 'index.html'))
  })
}

export default app

if (
  process.env.NODE_ENV !== 'production' &&
  !process.env.VERCEL
) {
  app.listen(port, () => {
    console.log(`TikClip API running at http://localhost:${port}`)
  })
}

import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = process.env.PORT || 3001
const root = path.dirname(fileURLToPath(import.meta.url))

app.use(express.json({ limit: '10kb' }))

// Supported Platforms Regex
const supportedPlatformsRegex = /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|instagram\.com|instagr\.am|youtube\.com|youtu\.be|facebook\.com|fb\.watch|fb\.me|twitter\.com|x\.com)/i
const isTikTokRegex = /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i

app.post('/api/download', async (request, response) => {
  const url = typeof request.body?.url === 'string' ? request.body.url.trim() : ''
  const mode = request.body?.mode === 'audio' ? 'audio' : 'video'
  const quality = ['standard', 'hd', 'max'].includes(request.body?.quality) ? request.body.quality : 'hd'

  if (!url || !supportedPlatformsRegex.test(url)) {
    return response.status(400).json({ error: 'Please enter a valid link from TikTok, Instagram, YouTube, Facebook, or X.' })
  }

  // 1. TIKTOK NATIVE METHOD (Fast & Reliable)
  if (isTikTokRegex.test(url)) {
    try {
      const resolver = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, { 
        headers: { 'User-Agent': 'TikClip/1.0' } 
      })
      if (resolver.ok) {
        const result = await resolver.json()
        const videoUrl = quality === 'standard' ? result?.data?.play : result?.data?.hdplay || result?.data?.play
        const mediaUrl = mode === 'audio' ? result?.data?.music : videoUrl
        if (result?.data && mediaUrl) {
          const extension = mode === 'audio' ? 'mp3' : 'mp4'
          return response.json({ downloadUrl: `/api/media?source=${encodeURIComponent(mediaUrl)}&type=${mode}`, filename: `tikclip-${mode}.${extension}` })
        }
      }
    } catch (e) {
      console.warn("TikTok native fetch failed, using universal fallback.")
    }
  }

  // 2. UNIVERSAL RESOLVER (Cobalt Current Active v10 API Endpoint)
  const cobaltInstances = [
    'https://api.cobalt.tools/',
    'https://cobalt-api.kwippy.com/'
  ]

  let lastErrorMessage = 'Could not resolve media from that link.'

  for (const instance of cobaltInstances) {
    try {
      const cobaltRes = await fetch(instance, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          videoQuality: quality === 'max' ? 'max' : (quality === 'standard' ? '480' : '720'),
          downloadMode: mode === 'audio' ? 'audio' : 'auto'
        })
      })

      const cobaltData = await cobaltRes.json()

      if (cobaltRes.ok && (cobaltData.status === 'redirect' || cobaltData.status === 'tunnel' || cobaltData.status === 'picker')) {
        let targetMediaUrl = ''
        if (cobaltData.status === 'redirect' || cobaltData.status === 'tunnel') {
          targetMediaUrl = cobaltData.url
        } else if (cobaltData.status === 'picker' && cobaltData.picker?.length > 0) {
          targetMediaUrl = cobaltData.picker[0].url
        }

        if (targetMediaUrl) {
          const extension = mode === 'audio' ? 'mp3' : 'mp4'
          return response.json({ 
            downloadUrl: `/api/media?source=${encodeURIComponent(targetMediaUrl)}&type=${mode}`, 
            filename: `tikclip-${mode}.${extension}` 
          })
        }
      } else if (cobaltData.text) {
        lastErrorMessage = cobaltData.text
      }
    } catch (err) {
      console.error(`Error with instance ${instance}:`, err)
    }
  }

  return response.status(502).json({ error: lastErrorMessage })
})

app.get('/api/media', async (request, response) => {
  const source = typeof request.query.source === 'string' ? request.query.source : ''
  const type = request.query.type === 'audio' ? 'audio' : 'video'
  if (!source.startsWith('http')) return response.status(400).end()
  try {
    const media = await fetch(source, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!media.ok || !media.body) return response.status(502).end()
    response.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4')
    response.setHeader('Content-Disposition', `attachment; filename="tikclip-${type}.${type === 'audio' ? 'mp3' : 'mp4'}"`)
    if (media.headers.get('content-length')) response.setHeader('Content-Length', media.headers.get('content-length'))
    return new Response(media.body).body?.pipeTo(new WritableStream({ write(chunk) { response.write(Buffer.from(chunk)) }, close() { response.end() } }))
  } catch {
    return response.status(502).end()
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist')))
  app.use((_request, response) => response.sendFile(path.join(root, 'dist', 'index.html')))
}

export default app

if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`TikClip API running at http://localhost:${port}`))
}
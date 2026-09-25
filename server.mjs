import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = process.env.PORT || 3001
const root = path.dirname(fileURLToPath(import.meta.url))

app.use(express.json({ limit: '10kb' }))

app.post('/api/download', async (request, response) => {
  const url = typeof request.body?.url === 'string' ? request.body.url.trim() : ''
  const mode = request.body?.mode === 'audio' ? 'audio' : 'video'
  const quality = ['standard', 'hd', 'max'].includes(request.body?.quality) ? request.body.quality : 'hd'
  if (!/^https?:\/\/(www\.)?(vm\.|vt\.)?tiktok\.com\//i.test(url)) {
    return response.status(400).json({ error: 'Please enter a valid TikTok link.' })
  }

  try {
    const resolver = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, { headers: { 'User-Agent': 'TikClip/1.0' } })
    if (!resolver.ok) throw new Error('The video service is unavailable right now.')
    const result = await resolver.json()
    const videoUrl = quality === 'standard' ? result?.data?.play : result?.data?.hdplay || result?.data?.play
    const mediaUrl = mode === 'audio' ? result?.data?.music : videoUrl
    if (!result?.data || !mediaUrl) throw new Error(mode === 'audio' ? 'No audio track was found for that link.' : 'No downloadable video was found for that link.')
    const extension = mode === 'audio' ? 'mp3' : 'mp4'
    return response.json({ downloadUrl: `/api/media?source=${encodeURIComponent(mediaUrl)}&type=${mode}`, filename: `tikclip-${mode}.${extension}` })
  } catch (error) {
    return response.status(502).json({ error: error instanceof Error ? error.message : 'Could not resolve that video.' })
  }
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

app.listen(port, () => console.log(`TikClip API running at http://localhost:${port}`))
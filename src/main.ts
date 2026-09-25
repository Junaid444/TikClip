import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="creator-credit" aria-hidden="true">Created By Junaid Rafi Shah</div>
  <header class="topbar">
    <a class="brand" href="/" aria-label="TikClip home"><span class="brand-mark">↘</span><span>tikclip</span></a>
    <span class="topbar-note"><span class="status-dot"></span> fast, clean downloads</span>
  </header>
  <main>
    <section class="hero">
      <div class="eyebrow"><span class="eyebrow-line"></span> TikTok video tool</div>
      <h1>Your video.<br><em>Just the good part.</em></h1>
      <p class="lede">Save TikTok videos as crisp MP4s, without the watermark. Paste a link and let TikClip handle the rest.</p>
      <form class="download-form" id="download-form">
        <label for="video-url" class="sr-only">TikTok video link</label>
        <div class="input-shell">
          <span class="link-icon">↗</span>
          <input id="video-url" name="url" type="url" placeholder="Paste a TikTok link here" autocomplete="off" required>
          <button class="paste-button" id="paste-button" type="button">Paste</button>
        </div>
        <div class="download-options">
          <label class="option-label" for="quality">Video quality
            <select id="quality" name="quality">
              <option value="standard">Standard</option>
              <option value="hd" selected>HD</option>
              <option value="max">Max quality</option>
            </select>
          </label>
          <label class="audio-toggle"><input id="audio-only" name="audioOnly" type="checkbox"><span class="toggle-track"></span><span>Audio only</span></label>
        </div>
        <button class="download-button" id="download-button" type="submit"><span>Download video</span><span class="button-arrow">↗</span></button>
      </form>
      <p class="form-message" id="form-message" role="status"></p>
      <p class="privacy-note"><span class="lock-icon">⌁</span> Your link is only used to fetch this video</p>
    </section>
    <section class="how-it-works" aria-labelledby="how-title">
      <div class="section-heading"><span class="section-kicker">01 / 03</span><h2 id="how-title">Three seconds<br>to your camera roll.</h2></div>
      <div class="steps">
        <article class="step"><span class="step-number">01</span><div><h3>Copy your link</h3><p>Use the share button on any TikTok video and copy its link.</p></div></article>
        <article class="step"><span class="step-number">02</span><div><h3>Drop it here</h3><p>Paste the link above. We will find the original video file.</p></div></article>
        <article class="step"><span class="step-number">03</span><div><h3>Keep the moment</h3><p>Download a clean MP4 and use it wherever you like.</p></div></article>
      </div>
    </section>
  </main>
  <footer><span>tikclip / made for your saved folder</span><span>MP4 · HD · no watermark</span></footer>
`

const form = document.querySelector<HTMLFormElement>('#download-form')!
const input = document.querySelector<HTMLInputElement>('#video-url')!
const button = document.querySelector<HTMLButtonElement>('#download-button')!
const pasteButton = document.querySelector<HTMLButtonElement>('#paste-button')!
const message = document.querySelector<HTMLParagraphElement>('#form-message')!
const quality = document.querySelector<HTMLSelectElement>('#quality')!
const audioOnly = document.querySelector<HTMLInputElement>('#audio-only')!

pasteButton.addEventListener('click', async () => {
  try {
    input.value = await navigator.clipboard.readText()
    input.focus()
    message.textContent = input.value ? 'Link pasted. Ready when you are.' : 'Your clipboard is empty.'
    message.className = `form-message ${input.value ? 'success' : 'error'}`
  } catch {
    input.focus()
    message.textContent = 'Paste with Ctrl + V.'
    message.className = 'form-message'
  }
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const url = input.value.trim()
  if (!url || !/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(url)) {
    message.textContent = 'That does not look like a TikTok link yet.'
    message.className = 'form-message error'
    input.focus()
    return
  }

  button.disabled = true
  const isAudio = audioOnly.checked
  button.querySelector('span')!.textContent = isAudio ? 'Finding audio...' : 'Finding video...'
  message.textContent = ''
  try {
    const response = await fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, quality: quality.value, mode: isAudio ? 'audio' : 'video' }) })
    const data = await response.json() as { error?: string; downloadUrl?: string; filename?: string }
    if (!response.ok || !data.downloadUrl) throw new Error(data.error || 'We could not find that video.')
    const download = document.createElement('a')
    download.href = data.downloadUrl
    download.download = data.filename || 'dropclip-video.mp4'
    document.body.appendChild(download)
    download.click()
    download.remove()
    message.textContent = isAudio ? 'Your audio download is on its way.' : 'Your video download is on its way.'
    message.className = 'form-message success'
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : 'Something went wrong. Try another link.'
    message.className = 'form-message error'
  } finally {
    button.disabled = false
    button.querySelector('span')!.textContent = 'Download video'
  }
})

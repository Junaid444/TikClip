import './style.css'
import './theme.css'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="creator-credit" aria-hidden="true">Created By Junaid Rafi Shah</div>
  <header class="topbar">
    <a class="brand" href="/" aria-label="TikClip home"><span class="brand-mark">↘</span><span>tikclip</span></a>
    <div class="topbar-actions">
      <span class="topbar-note"><span class="status-dot"></span> fast, clean downloads</span>
      <div class="theme-switch" role="group" aria-label="Color theme">
        <button class="theme-option" type="button" data-theme-option="light">Day</button>
        <button class="theme-option" type="button" data-theme-option="dark">Dark</button>
      </div>
    </div>
  </header>
  <main>
    <section class="hero">
      <div class="eyebrow"><span class="eyebrow-line"></span> TikTok video tool</div>
      <h1>Created by<br><em>Junaid Rafi Shah</em></h1>
      <p class="lede">Save TikTok videos as crisp MP4s, without the watermark. Paste a link and let TikClip handle the rest.</p>

      <!-- 1. MAIN VIDEO DOWNLOAD FORM -->
      <form class="download-form" id="download-form">
        <label for="video-url" class="sr-only">TikTok video link</label>
        <div class="input-shell">
          <span class="link-icon">↗</span>
          <input id="video-url" name="url" type="url" placeholder="Paste a TikTok video link here" autocomplete="off" required>
          <button class="clear-button" id="clear-button" type="button" style="background: rgba(0,0,0,0.08); border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; margin-right: 6px; transition: all 0.2s ease;">Clear</button>
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
        <button class="download-button" id="download-button" type="submit"><span>Download Video</span><span class="button-arrow">↗</span></button>
      </form>

      <!-- 2. DEDICATED TIKTOK SLIDES / PHOTO DOWNLOADER SECTION -->
      <div style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.03); border: 1px dashed rgba(0,0,0,0.15); border-radius: 12px; text-align: left;">
        <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 16px; font-weight: bold; color: var(--text-color, #1e293b);">🖼️ TikTok Photo / Slide Downloader</h3>
        <p style="margin-top: 0; margin-bottom: 15px; font-size: 13px; opacity: 0.8;">Paste a TikTok slideshow link below to view all full-res photos and download your favorite slides.</p>
        
        <form id="slide-download-form" style="display: flex; gap: 10px; flex-wrap: wrap;">
          <div style="flex: 1 1 250px; display: flex; align-items: center; background: var(--input-bg, #fff); border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; padding: 4px 8px;">
            <input id="slide-url" type="url" placeholder="Paste TikTok photo slide link here..." autocomplete="off" required style="width: 100%; border: none; background: transparent; padding: 8px; font-size: 14px; outline: none; color: inherit;">
            <button id="slide-clear-btn" type="button" style="background: rgba(0,0,0,0.08); border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; margin-right: 4px;">Clear</button>
            <button id="slide-paste-btn" type="button" style="background: #a3e635; color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">Paste</button>
          </div>
          <button id="slide-submit-btn" type="submit" style="background: #38adf2; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s;">Fetch Slides</button>
        </form>
        <p id="slide-message" style="margin-top: 10px; margin-bottom: 0; font-size: 13px; font-weight: 600;"></p>
        <div id="slide-results" style="margin-top: 15px;"></div>
      </div>

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

// Form elements
const form = document.querySelector<HTMLFormElement>('#download-form')!
const input = document.querySelector<HTMLInputElement>('#video-url')!
const button = document.querySelector<HTMLButtonElement>('#download-button')!
const pasteButton = document.querySelector<HTMLButtonElement>('#paste-button')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!
const message = document.querySelector<HTMLParagraphElement>('#form-message')!
const quality = document.querySelector<HTMLSelectElement>('#quality')!
const audioOnly = document.querySelector<HTMLInputElement>('#audio-only')!

// Slide elements
const slideForm = document.querySelector<HTMLFormElement>('#slide-download-form')!
const slideInput = document.querySelector<HTMLInputElement>('#slide-url')!
const slidePasteBtn = document.querySelector<HTMLButtonElement>('#slide-paste-btn')!
const slideClearBtn = document.querySelector<HTMLButtonElement>('#slide-clear-btn')!
const slideSubmitBtn = document.querySelector<HTMLButtonElement>('#slide-submit-btn')!
const slideMessage = document.querySelector<HTMLParagraphElement>('#slide-message')!
const slideResults = document.querySelector<HTMLDivElement>('#slide-results')!

const themeButtons = document.querySelectorAll<HTMLButtonElement>('[data-theme-option]')
type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('tikclip-theme', theme)
  themeButtons.forEach((themeButton) => {
    themeButton.setAttribute('aria-pressed', String(themeButton.dataset.themeOption === theme))
  })
}

const savedTheme = localStorage.getItem('tikclip-theme')
applyTheme(savedTheme === 'dark' ? 'dark' : 'light')

themeButtons.forEach((themeButton) => {
  themeButton.addEventListener('click', () => {
    const theme = themeButton.dataset.themeOption
    if (theme === 'light' || theme === 'dark') applyTheme(theme)
  })
})

// CLEAR BUTTONS
clearButton.addEventListener('click', () => {
  input.value = ''
  message.textContent = ''
  message.className = 'form-message'
  input.focus()
})

slideClearBtn.addEventListener('click', () => {
  slideInput.value = ''
  slideMessage.textContent = ''
  slideResults.innerHTML = ''
  slideInput.focus()
})

// PASTE BUTTONS
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

slidePasteBtn.addEventListener('click', async () => {
  try {
    slideInput.value = await navigator.clipboard.readText()
    slideInput.focus()
    slideMessage.textContent = slideInput.value ? 'Photo link pasted.' : 'Your clipboard is empty.'
    slideMessage.style.color = slideInput.value ? '#16a34a' : '#dc2626'
  } catch {
    slideInput.focus()
    slideMessage.textContent = 'Paste with Ctrl + V.'
    slideMessage.style.color = '#dc2626'
  }
})

// 1. VIDEO DIRECT DOWNLOAD FORM HANDLER
form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const rawUrl = input.value.trim()
  
  if (!rawUrl || !/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(rawUrl)) {
    message.textContent = 'That does not look like a TikTok link yet.'
    message.className = 'form-message error'
    input.focus()
    return
  }

  button.disabled = true
  const isAudio = audioOnly.checked
  button.querySelector('span')!.textContent = isAudio ? 'Finding audio...' : 'Downloading video...'
  message.textContent = ''

  try {
    const response = await fetch('/api/download', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ url: rawUrl, quality: quality.value, mode: isAudio ? 'audio' : 'video' }) 
    })
    
    const backendResponseText = await response.text()
    if (!backendResponseText) {
       throw new Error("Our server returned an empty response. Please try again.")
    }
    
    const data = JSON.parse(backendResponseText) as { error?: string; downloadUrl?: string; filename?: string }
    if (!response.ok || !data.downloadUrl) throw new Error(data.error || 'We could not find that video.')
    
    const download = document.createElement('a')
    download.href = data.downloadUrl
    download.download = data.filename || 'tikclip-video.mp4'
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
    button.querySelector('span')!.textContent = 'Download Video'
  }
})

// 2. TIKTOK SLIDES INDIVIDUAL DOWNLOAD HANDLER
slideForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const rawUrl = slideInput.value.trim()

  if (!rawUrl || !/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(rawUrl)) {
    slideMessage.textContent = 'Please enter a valid TikTok photo/slide link.'
    slideMessage.style.color = '#dc2626'
    return
  }

  slideSubmitBtn.disabled = true
  slideSubmitBtn.textContent = 'Fetching Slides...'
  slideMessage.textContent = ''
  slideResults.innerHTML = ''

  try {
    const res = await fetch(`/api/slides?url=${encodeURIComponent(rawUrl)}`)
    const data = await res.json()

    if (res.ok && data.images && data.images.length > 0) {
      const imagesList = data.images as string[]

      slideMessage.textContent = `Found ${imagesList.length} slides! Select individual slides to download below.`
      slideMessage.style.color = '#16a34a'

      let slidesHtml = `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: bold; opacity: 0.8;">Total: ${imagesList.length} Photos</span>
          <button id="download-all-slides-btn" type="button" style="background: #16a34a; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">Download All (${imagesList.length})</button>
        </div>
        <div style="display: flex; gap: 12px; overflow-x: auto; padding: 10px 0; scrollbar-width: thin;">
      `

      imagesList.forEach((imgUrl, idx) => {
        slidesHtml += `
          <div style="min-width: 150px; flex: 0 0 auto; text-align: center; background: #fff; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <img src="${imgUrl}" alt="Slide ${idx + 1}" style="width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 6px;" />
            <div>
              <span style="display: block; font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px;">Slide ${idx + 1}</span>
              <a href="${imgUrl}" target="_blank" download="tikclip-slide-${idx + 1}.jpg" style="display: block; width: 100%; box-sizing: border-box; background: #38adf2; color: #fff; padding: 6px 0; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: bold;">Download Photo</a>
            </div>
          </div>
        `
      })
      slidesHtml += `</div>`
      slideResults.innerHTML = slidesHtml

      // Handlers for Download All
      document.querySelector('#download-all-slides-btn')?.addEventListener('click', () => {
        imagesList.forEach((imgUrl, idx) => {
          setTimeout(() => {
            const a = document.createElement('a')
            a.href = imgUrl
            a.target = '_blank'
            a.download = `tikclip-slide-${idx + 1}.jpg`
            document.body.appendChild(a)
            a.click()
            a.remove()
          }, idx * 300)
        })
      })

    } else {
      slideMessage.textContent = data.error || 'Could not extract photo slides from this link.'
      slideMessage.style.color = '#dc2626'
    }
  } catch (err) {
    slideMessage.textContent = 'Failed to connect to server. Please try again.'
    slideMessage.style.color = '#dc2626'
  } finally {
    slideSubmitBtn.disabled = false
    slideSubmitBtn.textContent = 'Fetch Slides'
  }
})
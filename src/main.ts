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
      <div class="eyebrow"><span class="eyebrow-line"></span> TikTok video & photo tool</div>
      <h1>Created by<br><em>Junaid Rafi Shah</em></h1>
      <p class="lede">Save TikTok videos and photo slides without the watermark. Just paste a link and let TikClip handle the rest.</p>

      <!-- 1. MERGED SMART DOWNLOAD FORM -->
      <form class="download-form" id="download-form">
        <label for="video-url" class="sr-only">TikTok link</label>
        <div class="input-shell">
          <span class="link-icon">↗</span>
          <input id="video-url" name="url" type="url" placeholder="Paste a TikTok link here (Video or Photo)" autocomplete="off" required>
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
        <button class="download-button" id="download-button" type="submit"><span>Download Media</span><span class="button-arrow">↗</span></button>
      </form>

      <p class="form-message" id="form-message" role="status"></p>
      
      <!-- SLIDES RESULT CONTAINER -->
      <div id="slide-results" style="margin-top: 15px; width: 100%; overflow: hidden;"></div>

      <p class="privacy-note"><span class="lock-icon">⌁</span> Your link is only used to fetch media</p>
    </section>
    <section class="how-it-works" aria-labelledby="how-title">
      <div class="section-heading"><span class="section-kicker">01 / 03</span><h2 id="how-title">Three seconds<br>to your camera roll.</h2></div>
      <div class="steps">
        <article class="step"><span class="step-number">01</span><div><h3>Copy your link</h3><p>Use the share button on any TikTok video or photo slide and copy its link.</p></div></article>
        <article class="step"><span class="step-number">02</span><div><h3>Drop it here</h3><p>Paste the link above. We will detect whether it's a video or a photo post automatically.</p></div></article>
        <article class="step"><span class="step-number">03</span><div><h3>Keep the moment</h3><p>Download your media in high quality and use it wherever you like.</p></div></article>
      </div>
    </section>
  </main>
  <footer><span>tikclip / made for your saved folder</span><span>MP4 · HD · Photos · no watermark</span></footer>
`

const form = document.querySelector<HTMLFormElement>('#download-form')!
const input = document.querySelector<HTMLInputElement>('#video-url')!
const button = document.querySelector<HTMLButtonElement>('#download-button')!
const pasteButton = document.querySelector<HTMLButtonElement>('#paste-button')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!
const message = document.querySelector<HTMLParagraphElement>('#form-message')!
const quality = document.querySelector<HTMLSelectElement>('#quality')!
const audioOnly = document.querySelector<HTMLInputElement>('#audio-only')!
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

// HELPER FUNCTION: TO PREVENT CORRUPT IMAGE DOWNLOADS (Proxy method)
function triggerProxiedDownload(imageUrl: string, filename: string) {
  const proxyDownloadUrl = `/api/proxy?url=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(filename)}`
  const a = document.createElement('a')
  a.href = proxyDownloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// BUTTON HANDLERS
clearButton.addEventListener('click', () => {
  input.value = ''
  message.textContent = ''
  message.className = 'form-message'
  slideResults.innerHTML = ''
  input.focus()
})

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

// SMART FORM SUBMISSION (Auto Detects Slides or Video)
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
  button.querySelector('span')!.textContent = 'Analyzing link...'
  message.textContent = ''
  slideResults.innerHTML = ''

  try {
    let isSlideshow = false
    let imagesList: string[] = []

    // STEP 1: CHECK IF IT'S A PHOTO SLIDESHOW
    // Agar user ne 'Audio Only' check nahi kiya, toh hum check karte hain ke yeh slides toh nahi.
    if (!isAudio) {
      try {
        const slideRes = await fetch(`/api/slides?url=${encodeURIComponent(rawUrl)}`)
        if (slideRes.ok) {
          const slideData = await slideRes.json()
          if (slideData.images && slideData.images.length > 0) {
            isSlideshow = true
            imagesList = slideData.images
          }
        }
      } catch (e) {
        console.warn("Slide check skipped or failed, moving to video download.")
      }
    }

    // STEP 2: IF SLIDES FOUND, RENDER SLIDES UI
    if (isSlideshow && imagesList.length > 0) {
      message.textContent = `Found ${imagesList.length} slides! Select individual slides to download below.`
      message.className = 'form-message success'

      let slidesHtml = `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 13px; font-weight: bold; opacity: 0.8;">Total: ${imagesList.length} Photos</span>
          <button id="download-all-slides-btn" type="button" style="background: #16a34a; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">Download All (${imagesList.length})</button>
        </div>
        <div style="display: flex; gap: 12px; overflow-x: auto; padding: 10px 2px; max-width: 100%; box-sizing: border-box; scrollbar-width: thin;">
      `

      imagesList.forEach((imgUrl, idx) => {
        slidesHtml += `
          <div style="width: 140px; min-width: 140px; max-width: 140px; flex: 0 0 140px; text-align: center; background: var(--bg-color, #fff); padding: 8px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; gap: 8px; box-sizing: border-box;">
            <div style="width: 100%; height: 220px; overflow: hidden; border-radius: 6px; background: #1a1a1a; display: flex; align-items: center; justify-content: center;">
              <img src="${imgUrl}" alt="Slide ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div>
              <span style="display: block; font-size: 11px; font-weight: bold; margin-bottom: 4px; opacity: 0.7;">Slide ${idx + 1}</span>
              <button class="single-slide-download-btn" data-img-url="${imgUrl}" data-filename="tikclip-slide-${idx + 1}.jpg" style="display: block; width: 100%; box-sizing: border-box; background: #38adf2; color: #fff; padding: 6px 0; border: none; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">Download Photo</button>
            </div>
          </div>
        `
      })
      slidesHtml += `</div>`
      slideResults.innerHTML = slidesHtml

      // Attach Listeners for Slides
      document.querySelectorAll<HTMLButtonElement>('.single-slide-download-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const imgUrl = btn.getAttribute('data-img-url')!
          const filename = btn.getAttribute('data-filename')!
          triggerProxiedDownload(imgUrl, filename)
        })
      })

      document.querySelector<HTMLButtonElement>('#download-all-slides-btn')?.addEventListener('click', async () => {
        for (let idx = 0; idx < imagesList.length; idx++) {
          triggerProxiedDownload(imagesList[idx], `tikclip-slide-${idx + 1}.jpg`)
          await new Promise((r) => setTimeout(r, 400)) // Throttle to prevent browser crash
        }
      })

      button.disabled = false
      button.querySelector('span')!.textContent = 'Download Media'
      return // Process finished for slides!
    }

    // STEP 3: IF NOT SLIDES, PROCESS AS VIDEO/AUDIO (Fallback)
    button.querySelector('span')!.textContent = isAudio ? 'Downloading audio...' : 'Downloading video...'
    
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
    button.querySelector('span')!.textContent = 'Download Media'
  }
})
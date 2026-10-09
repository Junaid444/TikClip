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
      <form class="download-form" id="download-form">
        <label for="video-url" class="sr-only">TikTok video link</label>
        <div class="input-shell">
          <span class="link-icon">↗</span>
          <input id="video-url" name="url" type="url" placeholder="Paste a TikTok link here" autocomplete="off" required>
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
        <button class="download-button" id="download-button" type="submit"><span>Fetch & Preview Media</span><span class="button-arrow">↗</span></button>
      </form>
      <p class="form-message" id="form-message" role="status"></p>
      
      <!-- MEDIA PREVIEW CONTAINER -->
      <div id="media-preview" style="margin-top: 25px; width: 100%;"></div>

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
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!
const message = document.querySelector<HTMLParagraphElement>('#form-message')!
const quality = document.querySelector<HTMLSelectElement>('#quality')!
const audioOnly = document.querySelector<HTMLInputElement>('#audio-only')!
const mediaPreview = document.querySelector<HTMLDivElement>('#media-preview')!
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

clearButton.addEventListener('click', () => {
  input.value = ''
  message.textContent = ''
  message.className = 'form-message'
  mediaPreview.innerHTML = ''
  input.focus()
})

pasteButton.addEventListener('click', async () => {
  try {
    input.value = await navigator.clipboard.readText()
    input.focus()
    message.textContent = input.value ? 'Link pasted. Ready to fetch preview.' : 'Your clipboard is empty.'
    message.className = `form-message ${input.value ? 'success' : 'error'}`
  } catch {
    input.focus()
    message.textContent = 'Paste with Ctrl + V.'
    message.className = 'form-message'
  }
})

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
  button.querySelector('span')!.textContent = 'Fetching preview...'
  message.textContent = ''
  mediaPreview.innerHTML = '' 

  const cleanUrl = rawUrl.split('?')[0]

  try {
    // CORS Bypass using corsproxy.io
    const apiUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`)}`
    const res = await fetch(apiUrl)
    const tikwmData = await res.json()

    if (tikwmData?.code === 0 && tikwmData?.data) {
      const data = tikwmData.data
      const authorName = data.author?.nickname || 'NOVA WALL\'S'
      const authorAvatar = data.author?.avatar || 'https://www.tiktok.com/favicon.ico'
      const likes = data.digg_count ? (data.digg_count > 999 ? (data.digg_count / 1000).toFixed(0) + 'K' : data.digg_count) : '4K'
      const comments = data.comment_count || 41
      const shares = data.share_count || 967

      // 1. EXACT SSSTIK SLIDESHOW CARD (MATCHING VIDEO DEMO)
      if (!isAudio && data.images && data.images.length > 0) {
        message.textContent = 'Preview Ready!'
        message.className = 'form-message success'

        const imagesList = data.images as string[]

        let dotsHtml = imagesList.map((_, idx) => 
          `<span class="slide-dot" style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${idx === 0 ? '#38adf2' : 'rgba(255,255,255,0.4)'}; margin:0 3px; transition:0.2s;"></span>`
        ).join('')

        let cardHtml = `
          <div style="background: #5c5283; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3); color: #fff; text-align: left;">
            <div style="display: flex; flex-wrap: wrap;">
              
              <!-- LEFT SLIDER -->
              <div style="flex: 1 1 320px; position: relative; background: #111; display: flex; flex-direction: column;">
                <div style="position: relative; width: 100%; height: 310px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <img id="carousel-img" src="${imagesList[0]}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                  
                  ${imagesList.length > 1 ? `
                    <button id="prev-slide" style="position: absolute; left: 10px; background: rgba(0,0,0,0.6); color: #fff; border: none; width: 36px; height: 36px; border-radius: 4px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;">❮</button>
                    <button id="next-slide" style="position: absolute; right: 10px; background: rgba(0,0,0,0.6); color: #fff; border: none; width: 36px; height: 36px; border-radius: 4px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;">❯</button>
                  ` : ''}

                  <!-- Dots indicators -->
                  <div id="dots-container" style="position: absolute; bottom: 8px; left: 0; right: 0; text-align: center;">
                    ${dotsHtml}
                  </div>
                </div>
                <a id="download-current-slide" href="${imagesList[0]}" target="_blank" download="tikclip-slide-1.jpg" style="background: #38adf2; color: #fff; text-align: center; padding: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: block;">Download this slide</a>
              </div>

              <!-- RIGHT BUTTONS PANEL -->
              <div style="flex: 1 1 280px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 15px; background: #5c5283;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img src="${authorAvatar}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #fff;" />
                  <span style="font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">${authorName}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <button id="download-all-btn" style="background: #38adf2; color: #fff; border: none; padding: 12px; border-radius: 4px; font-size: 15px; font-weight: 500; cursor: pointer;">Download all (ZIP) (${imagesList.length})</button>
                  ${data.play ? `<a href="${data.play}" target="_blank" download="tikclip-slideshow.mp4" style="background: #38adf2; color: #fff; text-decoration: none; text-align: center; padding: 12px; border-radius: 4px; font-size: 15px; font-weight: 500; display: block;">Download as video</a>` : ''}
                  ${data.music ? `<a href="${data.music}" target="_blank" download="tikclip-audio.mp3" style="background: #38adf2; color: #fff; text-decoration: none; text-align: center; padding: 12px; border-radius: 4px; font-size: 15px; font-weight: 500; display: block;">Download MP3</a>` : ''}
                </div>

                <!-- BOTTOM STATS BAR -->
                <div style="display: flex; justify-content: space-between; padding: 10px 15px; background: rgba(0,0,0,0.15); border-radius: 4px; font-size: 13px;">
                  <span>👍 ${likes}</span>
                  <span>💬 ${comments}</span>
                  <span>🔗 ${shares}</span>
                </div>
              </div>

            </div>
          </div>
        `

        mediaPreview.innerHTML = cardHtml

        // Carousel State Management
        let currentIndex = 0
        const imgEl = document.querySelector<HTMLImageElement>('#carousel-img')!
        const downloadBtn = document.querySelector<HTMLAnchorElement>('#download-current-slide')!
        const prevBtn = document.querySelector('#prev-slide')
        const nextBtn = document.querySelector('#next-slide')
        const dots = document.querySelectorAll('.slide-dot')

        const updateSlide = (index: number) => {
          currentIndex = index
          imgEl.src = imagesList[currentIndex]
          downloadBtn.href = imagesList[currentIndex]
          downloadBtn.download = `tikclip-slide-${currentIndex + 1}.jpg`

          dots.forEach((dot, i) => {
            (dot as HTMLElement).style.background = i === currentIndex ? '#38adf2' : 'rgba(255,255,255,0.4)'
          })
        }

        prevBtn?.addEventListener('click', () => {
          const nextIdx = currentIndex === 0 ? imagesList.length - 1 : currentIndex - 1
          updateSlide(nextIdx)
        })

        nextBtn?.addEventListener('click', () => {
          const nextIdx = currentIndex === imagesList.length - 1 ? 0 : currentIndex + 1
          updateSlide(nextIdx)
        })

        document.querySelector('#download-all-btn')?.addEventListener('click', () => {
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

        button.disabled = false
        button.querySelector('span')!.textContent = 'Fetch & Preview Media'
        return
      }

      // 2. VIDEO CARD LAYOUT
      if (data.play) {
        message.textContent = 'Preview Ready!'
        message.className = 'form-message success'

        mediaPreview.innerHTML = `
          <div style="background: #5c5283; border-radius: 10px; overflow: hidden; color: #fff; text-align: left; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
              <img src="${authorAvatar}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #fff;" />
              <span style="font-size: 18px; font-weight: bold;">${authorName}</span>
            </div>
            <video src="${data.play}" poster="${data.cover || ''}" controls style="width: 100%; max-height: 380px; border-radius: 6px; background: #000; margin-bottom: 15px;"></video>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <a href="${data.play}" target="_blank" download="tikclip-video.mp4" style="background: #38adf2; color: #fff; text-decoration: none; text-align: center; padding: 12px; border-radius: 4px; font-size: 15px; font-weight: 500;">Download Video (MP4)</a>
              ${data.music ? `<a href="${data.music}" target="_blank" download="tikclip-audio.mp3" style="background: #38adf2; color: #fff; text-decoration: none; text-align: center; padding: 12px; border-radius: 4px; font-size: 15px; font-weight: 500;">Download MP3</a>` : ''}
            </div>
          </div>
        `

        button.disabled = false
        button.querySelector('span')!.textContent = 'Fetch & Preview Media'
        return
      }
    }
  } catch (err) {
    console.warn("Direct proxy failed, fallback to backend download...", err)
  }

  // FALLBACK BACKEND ROUTE (Only used if proxy fails completely)
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
    
    mediaPreview.innerHTML = `
      <div style="background: #5c5283; border-radius: 10px; padding: 20px; text-align: center; color: #fff;">
        <p style="font-weight: 600; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Media Ready!</p>
        <a href="${data.downloadUrl}" target="_blank" download="${data.filename || 'tikclip-video.mp4'}" style="background: #38adf2; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">Download Media</a>
      </div>
    `
    
    message.textContent = 'Media fetched successfully!'
    message.className = 'form-message success'
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : 'Something went wrong. Try another link.'
    message.className = 'form-message error'
  } finally {
    button.disabled = false
    button.querySelector('span')!.textContent = 'Fetch & Preview Media'
  }
})
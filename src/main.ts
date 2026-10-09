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

  const url = rawUrl.split('?')[0]

  button.disabled = true
  const isAudio = audioOnly.checked
  button.querySelector('span')!.textContent = 'Fetching preview...'
  message.textContent = ''
  mediaPreview.innerHTML = '' 

  try {
    const tikwmResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`)
    const responseText = await tikwmResponse.text()

    if (responseText) {
      const tikwmData = JSON.parse(responseText)

      if (tikwmData?.code === 0 && tikwmData?.data) {
        const data = tikwmData.data

        // 1. SLIDESHOW PICTURES PREVIEW & SELECTIVE DOWNLOAD
        if (!isAudio && data.images && data.images.length > 0) {
          message.textContent = 'Preview Ready! Select the pictures you want to download.'
          message.className = 'form-message success'

          let previewHtml = `
            <div style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin:0; font-size: 16px;">Pictures Found (${data.images.length})</h3>
                <div>
                  <button id="select-all-btn" type="button" style="background: #e2e8f0; color: #1e293b; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin-right: 8px;">Select All</button>
                  <button id="download-selected-btn" type="button" style="background: var(--button-bg, #a3e635); color: var(--button-text, #000); border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold;">Download Selected</button>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; max-height: 450px; overflow-y: auto; padding-right: 5px;">
          `

          data.images.forEach((imgUrl: string, index: number) => {
            previewHtml += `
              <div style="position: relative; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #000; display: flex; flex-direction: column;">
                <label style="position: absolute; top: 8px; left: 8px; z-index: 10; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                  <input type="checkbox" class="img-select-checkbox" data-img-url="${imgUrl}" checked style="accent-color: #a3e635; cursor: pointer;" />
                </label>
                <img src="${imgUrl}" alt="Slide ${index + 1}" style="width: 100%; aspect-ratio: 9/16; object-fit: cover;" />
                <a href="${imgUrl}" target="_blank" download="tikclip-img-${index + 1}.jpg" style="background: var(--button-bg, #a3e635); color: var(--button-text, #000); text-align: center; padding: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">Download This</a>
              </div>
            `
          })

          previewHtml += `</div></div>`
          mediaPreview.innerHTML = previewHtml

          // Select All Button
          const selectAllBtn = document.querySelector('#select-all-btn')
          const downloadSelectedBtn = document.querySelector('#download-selected-btn')

          let allSelected = true
          selectAllBtn?.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll<HTMLInputElement>('.img-select-checkbox')
            allSelected = !allSelected
            checkboxes.forEach((cb) => (cb.checked = allSelected))
            selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All'
          })

          // Download Selected Button
          downloadSelectedBtn?.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll<HTMLInputElement>('.img-select-checkbox:checked')
            if (checkboxes.length === 0) {
              alert('Please select at least one picture to download.')
              return
            }
            checkboxes.forEach((cb, idx) => {
              const imgUrl = cb.getAttribute('data-img-url')
              if (imgUrl) {
                setTimeout(() => {
                  const a = document.createElement('a')
                  a.href = imgUrl
                  a.target = '_blank'
                  a.download = `tikclip-picture-${idx + 1}.jpg`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                }, idx * 300)
              }
            })
          })

          button.disabled = false
          button.querySelector('span')!.textContent = 'Fetch & Preview Media'
          return
        }

        // 2. VIDEO PREVIEW PLAYER
        if (data.play) {
          message.textContent = 'Preview Ready! Check the video below before downloading.'
          message.className = 'form-message success'

          const videoUrl = data.play
          const coverUrl = data.cover || ''
          const title = data.title || 'TikTok Video'

          mediaPreview.innerHTML = `
            <div style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 15px; text-align: center;">
              <p style="font-weight: 600; margin-top: 0; margin-bottom: 10px; font-size: 14px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${title}</p>
              <video src="${videoUrl}" poster="${coverUrl}" controls style="width: 100%; max-width: 320px; max-height: 400px; border-radius: 8px; background: #000; margin-bottom: 15px;"></video>
              <div>
                <a href="${videoUrl}" target="_blank" download="tikclip-video.mp4" style="background: var(--button-bg, #a3e635); color: var(--button-text, #000); padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Download MP4 Video</a>
              </div>
            </div>
          `

          button.disabled = false
          button.querySelector('span')!.textContent = 'Fetch & Preview Media'
          return
        }
      }
    }
  } catch (err) {
    console.warn("Direct preview failed, using fallback backend...", err)
  }

  // 3. FALLBACK TO BACKEND API
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
      <div style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 15px; text-align: center;">
        <p style="font-weight: 600; margin-top: 0; margin-bottom: 10px;">Media Ready!</p>
        <a href="${data.downloadUrl}" target="_blank" download="${data.filename || 'tikclip-video.mp4'}" style="background: var(--button-bg, #a3e635); color: var(--button-text, #000); padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Download Media</a>
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
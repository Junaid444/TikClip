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
      
      <div id="image-results" style="margin-top: 20px; width: 100%;"></div>

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
const imageResults = document.querySelector<HTMLDivElement>('#image-results')!
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
  const rawUrl = input.value.trim()
  
  if (!rawUrl || !/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(rawUrl)) {
    message.textContent = 'That does not look like a TikTok link yet.'
    message.className = 'form-message error'
    input.focus()
    return
  }

  // URL CLEANING: Link mein se extra "?" tracking data nikalna taake API confuse na ho
  const url = rawUrl.split('?')[0];

  button.disabled = true
  const isAudio = audioOnly.checked
  button.querySelector('span')!.textContent = isAudio ? 'Finding audio...' : 'Finding media...'
  message.textContent = ''
  imageResults.innerHTML = '' 

  if (!isAudio) { 
    try {
      console.log("Checking for pictures via TikWM API for URL:", url);
      const tikwmResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
      const responseText = await tikwmResponse.text();
      
      if (responseText) {
        const tikwmData = JSON.parse(responseText);
        console.log("TikWM API Full Response:", tikwmData); // Debug log
        
        // Check if pictures exist in the response
        if (tikwmData?.code === 0 && tikwmData?.data?.images && tikwmData.data.images.length > 0) {
          message.textContent = 'Pictures found! Ready to download.';
          message.className = 'form-message success';
          
          let imagesHtml = `
            <div style="display: flex; gap: 15px; overflow-x: auto; padding: 15px 0; max-width: 100%; scrollbar-width: thin;">
          `;
          
          tikwmData.data.images.forEach((imgUrl: string, index: number) => {
            imagesHtml += `
              <div style="min-width: 180px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 10px;">
                <img src="${imgUrl}" alt="TikTok Picture ${index + 1}" style="width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                <a href="${imgUrl}" target="_blank" download="tikclip-image-${index + 1}.jpg" style="background-color: var(--button-bg, #a3e635); color: var(--button-text, #000); text-align: center; padding: 8px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Download</a>
              </div>
            `;
          });
          imagesHtml += '</div>';
          
          imageResults.innerHTML = imagesHtml;
          button.disabled = false;
          button.querySelector('span')!.textContent = 'Download video';
          return; 
        } else {
          console.log("No images found in response, falling back to video API.");
        }
      }
    } catch (picError) {
      console.warn("Picture API failed, error:", picError);
    }
  }

  // AGAR PICTURES NAHI HAIN TOH ORIGINAL VIDEO API
  button.querySelector('span')!.textContent = isAudio ? 'Finding audio...' : 'Finding video...'
  
  try {
    const response = await fetch('/api/download', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ url: rawUrl, quality: quality.value, mode: isAudio ? 'audio' : 'video' }) // Original link for backend
    })
    
    const backendResponseText = await response.text();
    if (!backendResponseText) {
       throw new Error("Our server returned an empty response. Please try again.");
    }
    
    const data = JSON.parse(backendResponseText) as { error?: string; downloadUrl?: string; filename?: string };
    
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
    button.querySelector('span')!.textContent = 'Download video'
  }
})

import './style.css'
import './theme.css'

type Platform =
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'facebook'
  | 'x'
  | 'unknown'

type DownloadResponse = {
  error?: string
  downloadUrl?: string
  filename?: string
}

type SlidesResponse = {
  images?: string[]
  error?: string
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('TikClip app container #app was not found.')
}

app.innerHTML = `
  <div class="creator-credit" aria-hidden="true">
    Created By Junaid Rafi Shah
  </div>

  <header class="topbar">
    <a class="brand" href="/" aria-label="TikClip home">
      <span class="brand-mark">↘</span>
      <span>tikclip</span>
    </a>

    <div class="topbar-actions">
      <span class="topbar-note">
        <span class="status-dot"></span>
        media link assistant
      </span>

      <div class="theme-switch" role="group" aria-label="Color theme">
        <button class="theme-option" type="button"
          data-theme-option="light">Day</button>
        <button class="theme-option" type="button"
          data-theme-option="dark">Dark</button>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="eyebrow">
        <span class="eyebrow-line"></span>
        All-in-one video &amp; photo tool
      </div>

      <h1>Created by<br><em>Junaid Rafi Shah</em></h1>

      <p class="lede">
        Paste a link from TikTok, Instagram, YouTube, Facebook, or X.
        Preview supported media and download files when the platform
        and your permissions allow it.
      </p>

      <form class="download-form" id="download-form">
        <label for="video-url" class="sr-only">Media link</label>

        <div class="input-shell">
          <span class="link-icon">↗</span>

          <input
            id="video-url"
            name="url"
            type="url"
            placeholder="Paste a link here (TikTok, IG, YT, FB, X)..."
            autocomplete="url"
            maxlength="2048"
            required
          >

          <button class="clear-button" id="clear-button" type="button">
            Clear
          </button>

          <button class="paste-button" id="paste-button" type="button">
            Paste
          </button>
        </div>

        <div class="download-options">
          <label class="option-label" for="quality">
            Video quality
            <select id="quality" name="quality">
              <option value="standard">Standard</option>
              <option value="hd" selected>HD</option>
              <option value="max">Max quality</option>
            </select>
          </label>

          <label class="audio-toggle">
            <input id="audio-only" name="audioOnly" type="checkbox">
            <span class="toggle-track"></span>
            <span>Audio only</span>
          </label>
        </div>

        <button class="download-button" id="download-button" type="submit">
          <span>Continue</span>
          <span class="button-arrow">↗</span>
        </button>
      </form>

      <p class="form-message" id="form-message" role="status"
        aria-live="polite"></p>

      <div id="slide-results"
        style="margin-top:15px;width:100%;overflow:hidden;">
      </div>

      <p class="privacy-note">
        <span class="lock-icon">⌁</span>
        Use links and media you are authorized to access and download.
      </p>
    </section>

    <section class="how-it-works" aria-labelledby="how-title">
      <div class="section-heading">
        <span class="section-kicker">01 / 03</span>
        <h2 id="how-title">Three simple steps<br>to manage your media.</h2>
      </div>

      <div class="steps">
        <article class="step">
          <span class="step-number">01</span>
          <div>
            <h3>Copy your link</h3>
            <p>Copy a supported post link or use a direct media link you are
              authorized to download.</p>
          </div>
        </article>

        <article class="step">
          <span class="step-number">02</span>
          <div>
            <h3>Paste it here</h3>
            <p>TikClip identifies the platform and checks which supported
              options are available.</p>
          </div>
        </article>

        <article class="step">
          <span class="step-number">03</span>
          <div>
            <h3>Choose an available option</h3>
            <p>Use an official viewing or download option, or download
              authorized media files.</p>
          </div>
        </article>
      </div>
    </section>
  </main>

  <footer>
    <span>tikclip / made for your saved folder</span>
    <span>Videos · Photos · Authorized downloads</span>
  </footer>
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

const themeButtons =
  document.querySelectorAll<HTMLButtonElement>('[data-theme-option]')

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme

  try {
    localStorage.setItem('tikclip-theme', theme)
  } catch {
    // The theme still works if browser storage is unavailable.
  }

  themeButtons.forEach((themeButton) => {
    themeButton.setAttribute(
      'aria-pressed',
      String(themeButton.dataset.themeOption === theme)
    )
  })
}

let savedTheme: string | null = null

try {
  savedTheme = localStorage.getItem('tikclip-theme')
} catch {
  // Use the default theme if browser storage is unavailable.
}

applyTheme(savedTheme === 'dark' ? 'dark' : 'light')

themeButtons.forEach((themeButton) => {
  themeButton.addEventListener('click', () => {
    const theme = themeButton.dataset.themeOption

    if (theme === 'light' || theme === 'dark') {
      applyTheme(theme)
    }
  })
})

function setMessage(text: string, kind: '' | 'success' | 'error' = '') {
  message.textContent = text
  message.className = kind ? `form-message ${kind}` : 'form-message'
}

function setBusy(busy: boolean, label = 'Continue') {
  button.disabled = busy
  button.querySelector('span')!.textContent = label
}

function detectPlatform(rawUrl: string): Platform {
  try {
    const url = new URL(rawUrl)

    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:') ||
      url.username ||
      url.password
    ) {
      return 'unknown'
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, '')

    if (
      host === 'tiktok.com' ||
      host.endsWith('.tiktok.com')
    ) {
      return 'tiktok'
    }

    if (
      host === 'instagram.com' ||
      host.endsWith('.instagram.com')
    ) {
      return 'instagram'
    }

    if (
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be'
    ) {
      return 'youtube'
    }

    if (
      host === 'facebook.com' ||
      host.endsWith('.facebook.com') ||
      host === 'fb.watch'
    ) {
      return 'facebook'
    }

    if (
      host === 'x.com' ||
      host.endsWith('.x.com') ||
      host === 'twitter.com' ||
      host.endsWith('.twitter.com')
    ) {
      return 'x'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function isSafeMediaUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl, window.location.origin)

    if (url.username || url.password) return false

    // Allow same-origin API/media paths, or HTTPS external URLs.
    if (url.origin === window.location.origin) {
      return true
    }

    return url.protocol === 'https:'
  } catch {
    return false
  }
}

function platformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    tiktok: 'TikTok',
    instagram: 'Instagram',
    youtube: 'YouTube',
    facebook: 'Facebook',
    x: 'X',
    unknown: 'Unknown platform'
  }

  return names[platform]
}

function showOfficialOptions(platform: Platform, rawUrl: string) {
  slideResults.replaceChildren()

  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'padding:16px;border:1px solid rgba(128,128,128,.3);border-radius:12px;text-align:left;'

  const heading = document.createElement('h3')
  heading.textContent = `${platformName(platform)} link detected`
  heading.style.marginTop = '0'

  const description = document.createElement('p')
  description.textContent =
    platform === 'youtube'
      ? 'Use YouTube’s official download features where available, or download content you own through an authorized workflow.'
      : 'TikClip can only download media when the platform, provider, and your permissions allow it. You can open the original post to view its available options.'

  const openLink = document.createElement('a')
  openLink.href = rawUrl
  openLink.target = '_blank'
  openLink.rel = 'noopener noreferrer'
  openLink.textContent = 'Open original post'
  openLink.style.cssText =
    'display:inline-block;margin-top:8px;padding:10px 14px;border-radius:8px;background:var(--accent-color,#268bd2);color:white;text-decoration:none;'

  wrapper.append(heading, description, openLink)
  slideResults.append(wrapper)
}

function renderSlides(images: string[]) {
  slideResults.replaceChildren()

  const safeImages = images.filter(
    (url) => typeof url === 'string' && isSafeMediaUrl(url)
  )

  if (safeImages.length === 0) return false

  const header = document.createElement('div')
  header.style.cssText =
    'margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;'

  const count = document.createElement('span')
  count.textContent = `Available photos: ${safeImages.length}`
  count.style.fontWeight = 'bold'

  header.append(count)
  slideResults.append(header)

  const list = document.createElement('div')
  list.style.cssText =
    'display:flex;gap:12px;overflow-x:auto;padding:10px 2px;max-width:100%;scrollbar-width:thin;'

  safeImages.forEach((imageUrl, index) => {
    const card = document.createElement('article')
    card.style.cssText =
      'width:140px;min-width:140px;flex:0 0 140px;text-align:center;padding:8px;border-radius:8px;border:1px solid rgba(128,128,128,.3);display:flex;flex-direction:column;gap:8px;box-sizing:border-box;'

    const imageBox = document.createElement('div')
    imageBox.style.cssText =
      'width:100%;height:220px;overflow:hidden;border-radius:6px;background:#1a1a1a;'

    const image = document.createElement('img')
    image.src = imageUrl
    image.alt = `Photo ${index + 1}`
    image.loading = 'lazy'
    image.referrerPolicy = 'no-referrer'
    image.style.cssText =
      'width:100%;height:100%;object-fit:cover;'

    imageBox.append(image)

    const label = document.createElement('span')
    label.textContent = `Photo ${index + 1}`
    label.style.fontSize = '12px'

    const downloadLink = document.createElement('a')
    downloadLink.href = imageUrl
    downloadLink.target = '_blank'
    downloadLink.rel = 'noopener noreferrer'
    downloadLink.textContent = 'Open photo'
    downloadLink.style.cssText =
      'display:block;padding:7px 4px;border-radius:6px;background:#268bd2;color:white;text-decoration:none;font-size:12px;'

    card.append(imageBox, label, downloadLink)
    list.append(card)
  })

  slideResults.append(list)
  return true
}

clearButton.addEventListener('click', () => {
  input.value = ''
  setMessage('')
  slideResults.replaceChildren()
  input.focus()
})

pasteButton.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.readText) {
      throw new Error('Clipboard access unavailable')
    }

    input.value = await navigator.clipboard.readText()
    input.focus()

    setMessage(
      input.value ? 'Link pasted. Ready when you are.' : 'Your clipboard is empty.',
      input.value ? 'success' : 'error'
    )
  } catch {
    input.focus()
    setMessage('Clipboard access is unavailable. Paste using Ctrl + V.')
  }
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const rawUrl = input.value.trim()
  const platform = detectPlatform(rawUrl)

  if (platform === 'unknown') {
    setMessage(
      'Enter a valid HTTPS link from TikTok, Instagram, YouTube, Facebook, or X.',
      'error'
    )
    input.focus()
    return
  }

  // YouTube is not sent to a generic downloader.
  if (platform === 'youtube') {
    setMessage(
      'Use YouTube’s official download options where available. TikClip cannot provide unauthorized YouTube downloads.'
    )
    showOfficialOptions(platform, rawUrl)
    return
  }

  setBusy(true, 'Checking link...')
  setMessage('')
  slideResults.replaceChildren()

  try {
    // First, check whether the backend supports photo slides.
    if (!audioOnly.checked) {
      try {
        const slidesResponse = await fetch(
          `/api/slides?url=${encodeURIComponent(rawUrl)}`,
          { headers: { Accept: 'application/json' } }
        )

        if (slidesResponse.ok) {
          const slidesData =
            (await slidesResponse.json()) as SlidesResponse

          if (
            Array.isArray(slidesData.images) &&
            renderSlides(slidesData.images)
          ) {
            setMessage(
              'Photo links found. Open each photo to view or save it, subject to the source’s permissions.',
              'success'
            )
            return
          }
        }
      } catch {
        // A failed photo check should not hide the video result.
      }
    }

    // Ask the backend to handle only authorized provider workflows.
    setBusy(true, 'Checking available options...')

    const response = await fetch('/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        url: rawUrl,
        platform,
        quality: quality.value,
        mode: audioOnly.checked ? 'audio' : 'video'
      })
    })

    const responseText = await response.text()

    let data: DownloadResponse

    try {
      data = JSON.parse(responseText) as DownloadResponse
    } catch {
      throw new Error(
        responseText
          ? 'The server returned an unexpected response. Please try again later.'
          : 'The server returned an empty response.'
      )
    }

    if (!response.ok) {
      throw new Error(data.error || 'This download is not available.')
    }

    if (!data.downloadUrl || !isSafeMediaUrl(data.downloadUrl)) {
      throw new Error(
        data.error ||
          'The server did not return a valid authorized media link.'
      )
    }

    const downloadUrl = new URL(
      data.downloadUrl,
      window.location.origin
    ).href

    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.rel = 'noopener noreferrer'

    if (data.filename) {
      // Avoid unsafe or misleading filenames.
      const safeFilename = data.filename
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
        .slice(0, 150)

      if (safeFilename) {
        downloadLink.download = safeFilename
      }
    }

    document.body.append(downloadLink)
    downloadLink.click()
    downloadLink.remove()

    setMessage(
      'Your authorized media link is ready. If the file does not download automatically, open the link in your browser.',
      'success'
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.'

    setMessage(errorMessage, 'error')

    // Show a useful fallback instead of leaving users stuck.
    showOfficialOptions(platform, rawUrl)
  } finally {
    setBusy(false, 'Continue')
  }
})

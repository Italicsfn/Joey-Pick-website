import { useEffect, useState } from 'react'
import { otherWorks } from '../../config.js'
import Gallery from './Gallery.jsx'
import Lightbox from './Lightbox.jsx'

const DRIVE = 'https://www.googleapis.com/drive/v3'

// Look up a folder's display name (used as the section title).
async function fetchFolderName(folderId, apiKey) {
  const params = new URLSearchParams({ key: apiKey, fields: 'name' })
  const res = await fetch(`${DRIVE}/files/${folderId}?${params}`)
  if (!res.ok) throw new Error(`Drive API returned ${res.status}`)
  const data = await res.json()
  return data.name || 'Untitled'
}

// List every image in a public Drive folder (handles pagination).
async function listFolderImages(folderId, apiKey) {
  const files = []
  let pageToken = ''
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      key: apiKey,
      fields: 'nextPageToken, files(id, name)',
      orderBy: 'name_natural',
      pageSize: '1000',
    })
    if (pageToken) params.set('pageToken', pageToken)
    const res = await fetch(`${DRIVE}/files?${params}`)
    if (!res.ok) throw new Error(`Drive API returned ${res.status}`)
    const data = await res.json()
    files.push(...(data.files || []))
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return files
}

// Stable public-image endpoint for a Drive file (works in <img>, no CORS/key).
const driveImage = (id, width) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`

// Fisher–Yates shuffle (returns a new array; does not mutate input).
function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// One folder -> one titled, shuffled gallery with its own lightbox.
function CategorySection({ folder, apiKey, shuffle }) {
  const [title, setTitle] = useState(folder.name || '')
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('loading') // loading | error | done
  const [active, setActive] = useState(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const [name, files] = await Promise.all([
          folder.name ? Promise.resolve(folder.name) : fetchFolderName(folder.id, apiKey),
          listFolderImages(folder.id, apiKey),
        ])
        const mapped = files.map((f) => ({
          src: driveImage(f.id, 1600),
          alt: f.name.replace(/\.[^.]+$/, ''),
        }))
        if (!cancelled) {
          setTitle(name)
          setPhotos(shuffle ? shuffled(mapped) : mapped)
          setStatus('done')
        }
      } catch (err) {
        console.error(`Failed to load Drive folder ${folder.id}:`, err)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [folder.id, folder.name, apiKey, shuffle])

  // Skip folders that error out or have no photos, so the page stays clean.
  if (status === 'error') return null
  if (status === 'done' && photos.length === 0) return null

  return (
    <div className="category">
      <h3 className="category__title">{title || '…'}</h3>

      {status === 'loading' ? (
        <p className="gallery__empty">Loading photos…</p>
      ) : (
        <Gallery photos={photos} onSelect={setActive} />
      )}

      {active !== null && (
        <Lightbox
          photos={photos}
          index={active}
          onClose={() => setActive(null)}
          onNext={() => setActive((i) => (i + 1) % photos.length)}
          onPrev={() => setActive((i) => (i - 1 + photos.length) % photos.length)}
        />
      )}
    </div>
  )
}

export default function OtherWorks() {
  const { title, apiKey, shuffle, folders } = otherWorks
  const enabled = Boolean(apiKey) && Array.isArray(folders) && folders.length > 0

  // Section stays hidden until an API key + at least one folder are configured.
  if (!enabled) return null

  return (
    <section id="other-works" className="section">
      <h2 className="section__title">{title}</h2>
      {folders.map((folder) => (
        <CategorySection
          key={folder.id}
          folder={folder}
          apiKey={apiKey}
          shuffle={shuffle}
        />
      ))}
    </section>
  )
}

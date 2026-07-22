import { useEffect, useState } from 'react'
import { otherWorks } from '../../config.js'
import Gallery from './Gallery.jsx'
import Lightbox from './Lightbox.jsx'

// List every image in a public Drive folder via the Drive API (paginated).
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
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`)
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

export default function OtherWorks() {
  const { title, apiKey, folderIds } = otherWorks
  const enabled = Boolean(apiKey) && Array.isArray(folderIds) && folderIds.length > 0

  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | error | done
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const collected = []
        for (const id of folderIds) {
          const files = await listFolderImages(id, apiKey)
          for (const f of files) {
            collected.push({
              src: driveImage(f.id, 1600),
              alt: f.name.replace(/\.[^.]+$/, ''),
            })
          }
        }
        if (!cancelled) {
          setPhotos(collected)
          setStatus('done')
        }
      } catch (err) {
        console.error('Failed to load Drive photos:', err)
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
    // folderIds is a small array from config; stringify for a stable dep.
  }, [enabled, apiKey, JSON.stringify(folderIds)])

  // Section is hidden entirely until configured with an API key + folder.
  if (!enabled) return null

  return (
    <section id="other-works" className="section">
      <h2 className="section__title">{title}</h2>

      {status === 'loading' && <p className="gallery__empty">Loading photos…</p>}

      {status === 'error' && (
        <p className="gallery__empty">
          Couldn’t load photos from Google Drive. Make sure the folder is shared
          as “Anyone with the link” and the API key is valid.
        </p>
      )}

      {status === 'done' && photos.length === 0 && (
        <p className="gallery__empty">No photos found in the Drive folder yet.</p>
      )}

      {status === 'done' && photos.length > 0 && (
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
    </section>
  )
}

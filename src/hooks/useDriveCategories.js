import { useEffect, useState } from 'react'
import { otherWorks } from '../../config.js'
import {
  fetchFolderName,
  listFolderImages,
  driveImage,
  shuffled,
} from '../lib/drive.js'

// Loads every configured Drive folder into a list of categories:
//   [{ id, name, photos: [{ src, alt }] }]
// Each folder is fetched independently, so one unshared/broken folder
// never blocks the others — it's just skipped.
export function useDriveCategories() {
  const { apiKey, shuffle, folders } = otherWorks
  const enabled =
    Boolean(apiKey) && Array.isArray(folders) && folders.length > 0

  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState(enabled ? 'loading' : 'disabled')

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const results = await Promise.all(
        folders.map(async (entry) => {
          // A category is backed by one folder (`id`) or several (`ids`).
          const ids = entry.ids || [entry.id]
          const catId = ids[0]
          try {
            // Merged categories require a `name`; single folders can borrow
            // the folder's own name from Drive.
            const name = entry.name || (await fetchFolderName(ids[0], apiKey))
            const fileGroups = await Promise.all(
              ids.map((id) => listFolderImages(id, apiKey)),
            )
            const photos = fileGroups.flat().map((f) => ({
              src: driveImage(f.id, 1600),
              alt: f.name.replace(/\.[^.]+$/, ''),
            }))
            return { id: catId, name, photos: shuffle ? shuffled(photos) : photos }
          } catch (err) {
            console.error(`Failed to load Drive folder(s) ${ids.join(', ')}:`, err)
            return null
          }
        }),
      )
      if (cancelled) return
      const usable = results.filter((c) => c && c.photos.length > 0)
      setCategories(usable)
      setStatus(usable.length > 0 ? 'done' : 'error')
    })()
    return () => {
      cancelled = true
    }
    // folders is a small config array; stringify for a stable dependency.
  }, [enabled, apiKey, shuffle, JSON.stringify(folders)])

  return { enabled, categories, status }
}

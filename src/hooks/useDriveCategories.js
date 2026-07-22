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
        folders.map(async (folder) => {
          try {
            const [name, files] = await Promise.all([
              folder.name
                ? Promise.resolve(folder.name)
                : fetchFolderName(folder.id, apiKey),
              listFolderImages(folder.id, apiKey),
            ])
            const photos = files.map((f) => ({
              src: driveImage(f.id, 1600),
              alt: f.name.replace(/\.[^.]+$/, ''),
            }))
            return { id: folder.id, name, photos: shuffle ? shuffled(photos) : photos }
          } catch (err) {
            console.error(`Failed to load Drive folder ${folder.id}:`, err)
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

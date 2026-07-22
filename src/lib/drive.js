// Helpers for reading photos out of public Google Drive folders.

const DRIVE = 'https://www.googleapis.com/drive/v3'

// Look up a folder's display name (used as the category label).
export async function fetchFolderName(folderId, apiKey) {
  const params = new URLSearchParams({ key: apiKey, fields: 'name' })
  const res = await fetch(`${DRIVE}/files/${folderId}?${params}`)
  if (!res.ok) throw new Error(`Drive API returned ${res.status}`)
  const data = await res.json()
  return data.name || 'Untitled'
}

// List every image in a public Drive folder (handles pagination).
export async function listFolderImages(folderId, apiKey) {
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
export const driveImage = (id, width) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`

// Fisher–Yates shuffle (returns a new array; does not mutate input).
export function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

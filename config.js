// ============================================================================
//  SITE CONFIG — edit everything here. No need to touch component code.
// ============================================================================

export const site = {
  // Shown in the top-left nav and the browser tab.
  title: 'Joeyflicks',
  // Short tagline under the title on the landing/header. Set to '' to hide.
  tagline: 'Photography',
}

// ----------------------------------------------------------------------------
//  "OTHER WORKS" — auto-loads photos from PUBLIC Google Drive folders.
//  Each folder below becomes its own titled section (e.g. one per sport).
//  Drop photos into a Drive folder and they show up on the site automatically —
//  no uploads, no editing this file.
//
//  ONE-TIME SETUP (see README for click-by-click steps):
//   1. Share each Drive folder as "Anyone with the link" (Viewer).
//   2. Create ONE free Google API key (Drive API enabled) and paste it as
//      `apiKey` below. Until this is set, the whole section stays hidden.
//
//  Section titles come from the Drive folder's own name automatically. To
//  override a title, add a `name:` — e.g. { id: '...', name: 'Basketball' }.
// ----------------------------------------------------------------------------
export const otherWorks = {
  // Heading shown above the whole area, and its nav link label.
  title: 'Other Works',
  // Free Google API key with the Drive API enabled. Empty = section hidden.
  apiKey: 'AIzaSyDM_LGPP4uOy4vhCb-cMVzjw8hYpp050iM',
  // Shuffle photos within each section for a fresh, varied mix each visit.
  shuffle: true,
  // Each PUBLIC Drive folder = one section. Titled after the folder name.
  folders: [
    { id: '1n0sUen9y3CEZRledl-x97Rg-p6Nolz6H' },
    { id: '15yUDNUcPENYjrI-Q-MHshnNwXgL5tftt' },
    { id: '1xuPip9SKf6mdQc2h_Xw5pD_57GSWBIVv' },
    { id: '1WiyJToRV6IKN_gwT6jlKwhI2OsH_szzh' },
    { id: '1rZ5HaTzMbzm4LBjyYpiMyezS_km7MguA' },
    { id: '1No_H_5c8mqOMg_6yALKlziSSCZr4J0EN' },
  ],
}

// ----------------------------------------------------------------------------
//  CONTACT LINKS
//  These power the floating "Contact" button in the bottom-right corner.
//  Only links with a non-empty `url` are shown. Fill in your real handles.
// ----------------------------------------------------------------------------
export const contact = {
  // Your email — used to build a mailto: link.
  email: 'johnathantran9999@gmail.com',
  // Full Instagram profile URL.
  instagram: 'https://instagram.com/joe.jpg27',
  // Optional extras — leave as '' to hide them.
  twitter: '',
  linkedin: '',
}

// ----------------------------------------------------------------------------
//  PHOTOS
//  1. Drop image files into the /public/photos folder.
//  2. Add an entry below. `src` is the path under /public
//     (so /public/photos/sunset.jpg  ->  src: '/photos/sunset.jpg').
//  3. `alt` is used for accessibility + shown as a caption in the lightbox.
//  Reorder the list to reorder the gallery. First item shows first.
// ----------------------------------------------------------------------------
export const photos = [
  { src: '/photos/Photo 1.jpg', alt: 'Photo 1' },
  { src: '/photos/Photo 2.jpg', alt: 'Photo 2' },
  { src: '/photos/Photo 3.jpg', alt: 'Photo 3' },
  { src: '/photos/Photo 4.jpg', alt: 'Photo 4' },
  { src: '/photos/Photo 5.jpg', alt: 'Photo 5' },
  { src: '/photos/Photo 6.jpg', alt: 'Photo 6' },
]

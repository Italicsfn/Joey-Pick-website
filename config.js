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
//  CONTACT LINKS
//  These power the floating "Contact" button in the bottom-right corner.
//  Only links with a non-empty `url` are shown. Fill in your real handles.
// ----------------------------------------------------------------------------
export const contact = {
  // Your email — used to build a mailto: link.
  email: 'you@example.com',
  // Full Instagram profile URL.
  instagram: 'https://instagram.com/your_handle',
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
]

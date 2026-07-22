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
//  "OTHER WORKS" — auto-loads photos from a public Google Drive folder.
//  Drop photos into the Drive folder and they show up on the site. No uploads,
//  no editing this list. Leave `apiKey` empty to hide this section entirely.
//
//  ONE-TIME SETUP (see README for step-by-step):
//   1. Put photos in a Google Drive folder, then Share it as
//      "Anyone with the link" (Viewer).
//   2. Copy the folder ID from the share link:
//        https://drive.google.com/drive/folders/THIS_LONG_ID_HERE?usp=sharing
//      ...and add it to `folderIds` below.
//   3. Create a free Google API key with the Drive API enabled, paste as apiKey.
// ----------------------------------------------------------------------------
export const otherWorks = {
  // Heading shown above this section, and its nav link label.
  title: 'Other Works',
  // Free Google API key (Drive API enabled). Empty = section hidden.
  apiKey: '',
  // One or more PUBLIC Drive folder IDs. Photos load in filename order.
  folderIds: [
    // 'paste-your-folder-id-here',
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

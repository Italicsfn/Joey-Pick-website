# Joeyflicks — Photography Portfolio

A clean, minimal, dark-mode-friendly photography portfolio built with **React + Vite**
and ready to deploy to **Netlify** with zero extra config.

Features:

- Responsive masonry gallery loaded from a local `public/photos` folder
- Click any photo to open a lightbox with next / prev / close (and keyboard: `←` `→` `Esc`)
- Lazy-loaded images so it stays fast with lots of photos
- A floating **Contact** button (bottom-right) that expands to Instagram + Email links
- All your text, links, and photo list live in one file: [`config.js`](./config.js)

---

## Getting started (local dev)

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install     # install dependencies
npm run dev     # start local dev server (prints a localhost URL)
```

To preview a production build locally:

```bash
npm run build   # outputs to /dist
npm run preview
```

---

## Adding new photos

1. Drop your image files into **`public/photos/`** (JPG, PNG, WebP, etc.).
2. Open **`config.js`** and add an entry to the `photos` array:

   ```js
   export const photos = [
     { src: '/photos/sunset.jpg', alt: 'Sunset over the bay' },
     { src: '/photos/portrait.jpg', alt: 'Studio portrait' },
     // ...add more
   ]
   ```

   - `src` is the path **under `/public`** — a file at `public/photos/sunset.jpg`
     is referenced as `'/photos/sunset.jpg'`.
   - `alt` describes the image (used for accessibility and shown as the lightbox caption).
   - **Order matters** — the array order is the gallery order. First entry shows first.

3. The six `sample-0X.svg` placeholders in `public/photos` are just demo images —
   delete them (and their entries in `config.js`) once you add your own.

> Tip: for fast loading, resize very large photos to ~2000px on the long edge
> before adding them.

---

## Updating contact links

Everything is in **`config.js`**:

```js
export const contact = {
  email: 'you@example.com',                       // becomes a mailto: link
  instagram: 'https://instagram.com/your_handle', // full profile URL
  twitter: '',   // optional — leave '' to hide
  linkedin: '',  // optional — leave '' to hide
}
```

Only links with a non-empty value appear in the floating Contact panel.
Twitter/X and LinkedIn are wired up already — just add a URL to turn them on.

You can also change your **site title** and **tagline** at the top of `config.js`:

```js
export const site = {
  title: 'Joeyflicks',
  tagline: 'Photography', // set to '' to hide
}
```

---

## Deploying to Netlify

This repo includes [`netlify.toml`](./netlify.toml) with everything Netlify needs.

**Option A — connect the repo (recommended):**

1. Push this project to GitHub.
2. In Netlify: **Add new site → Import an existing project** and pick the repo.
3. Netlify auto-detects the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy. Every push to your branch redeploys automatically.

**Option B — drag & drop:**

```bash
npm run build
```

Then drag the generated **`dist/`** folder into the Netlify dashboard.

---

## Project structure

```
config.js              ← edit everything here (title, contact, photo list)
index.html
netlify.toml           ← Netlify build config + SPA redirect
public/
  favicon.svg
  photos/              ← your image files go here
src/
  main.jsx
  App.jsx
  components/
    Navbar.jsx
    Gallery.jsx
    Lightbox.jsx
    ContactButton.jsx
    icons.jsx
  styles/
    index.css          ← theme tokens at the top; tweak colors here
```

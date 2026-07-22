import { useState } from 'react'
import { site, photos } from '../config.js'
import Navbar from './components/Navbar.jsx'
import Gallery from './components/Gallery.jsx'
import Lightbox from './components/Lightbox.jsx'
import ContactButton from './components/ContactButton.jsx'

export default function App() {
  // Index of the photo currently open in the lightbox, or null when closed.
  const [activeIndex, setActiveIndex] = useState(null)

  const openAt = (index) => setActiveIndex(index)
  const close = () => setActiveIndex(null)
  const next = () => setActiveIndex((i) => (i + 1) % photos.length)
  const prev = () => setActiveIndex((i) => (i - 1 + photos.length) % photos.length)

  return (
    <div className="app">
      <Navbar />

      <main id="gallery" className="content">
        <header className="hero">
          <h1 className="hero__title">{site.title}</h1>
          {site.tagline && <p className="hero__tagline">{site.tagline}</p>}
        </header>

        <Gallery photos={photos} onSelect={openAt} />
      </main>

      {activeIndex !== null && (
        <Lightbox
          photos={photos}
          index={activeIndex}
          onClose={close}
          onNext={next}
          onPrev={prev}
        />
      )}

      <ContactButton />
    </div>
  )
}

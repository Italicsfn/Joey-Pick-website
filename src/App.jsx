import { useEffect, useState } from 'react'
import { site, photos } from '../config.js'
import { useDriveCategories } from './hooks/useDriveCategories.js'
import Navbar from './components/Navbar.jsx'
import Gallery from './components/Gallery.jsx'
import Lightbox from './components/Lightbox.jsx'
import OtherWorks from './components/OtherWorks.jsx'
import ContactButton from './components/ContactButton.jsx'

export default function App() {
  // Index of the photo currently open in the MAIN gallery lightbox, or null.
  const [activeIndex, setActiveIndex] = useState(null)

  // Google Drive "Other Works" categories, shared by the nav menu + section.
  const { enabled, categories, status } = useDriveCategories()
  const [activeCategoryId, setActiveCategoryId] = useState(null)

  // Default to the first category once they've loaded.
  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  // Selecting from the nav menu switches category AND scrolls to the section.
  const goToCategory = (id) => {
    setActiveCategoryId(id)
    requestAnimationFrame(() => {
      document
        .getElementById('other-works')
        ?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const openAt = (index) => setActiveIndex(index)
  const close = () => setActiveIndex(null)
  const next = () => setActiveIndex((i) => (i + 1) % photos.length)
  const prev = () => setActiveIndex((i) => (i - 1 + photos.length) % photos.length)

  return (
    <div className="app">
      <Navbar
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={goToCategory}
      />

      <main id="gallery" className="content">
        <header className="hero">
          <h1 className="hero__title">{site.title}</h1>
          {site.tagline && <p className="hero__tagline">{site.tagline}</p>}
        </header>

        <Gallery photos={photos} onSelect={openAt} />
      </main>

      <OtherWorks
        enabled={enabled}
        status={status}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
      />

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

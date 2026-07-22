import { useState } from 'react'
import { otherWorks } from '../../config.js'
import Gallery from './Gallery.jsx'
import Lightbox from './Lightbox.jsx'

// Displays one category at a time, with tab pills to switch between them.
// Data (categories) is loaded in App and passed down so the nav dropdown
// and this section stay in sync.
export default function OtherWorks({
  enabled,
  status,
  categories,
  activeCategoryId,
  onSelectCategory,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!enabled) return null

  const current =
    categories.find((c) => c.id === activeCategoryId) || categories[0]
  const photos = current?.photos || []

  const switchTo = (id) => {
    onSelectCategory(id)
    setLightboxIndex(null) // close any open lightbox when changing category
  }

  return (
    <section id="other-works" className="section">
      <h2 className="section__title">{otherWorks.title}</h2>

      {status === 'loading' && <p className="gallery__empty">Loading photos…</p>}

      {status === 'error' && (
        <p className="gallery__empty">
          Couldn’t load photos from Google Drive. Make sure each folder is shared
          as “Anyone with the link.”
        </p>
      )}

      {status === 'done' && current && (
        <>
          <div className="tabs" role="tablist" aria-label="Photo categories">
            {categories.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={c.id === current.id}
                className={'tab' + (c.id === current.id ? ' is-active' : '')}
                onClick={() => switchTo(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <Gallery photos={photos} onSelect={setLightboxIndex} />
        </>
      )}

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((i) => (i + 1) % photos.length)}
          onPrev={() =>
            setLightboxIndex((i) => (i - 1 + photos.length) % photos.length)
          }
        />
      )}
    </section>
  )
}

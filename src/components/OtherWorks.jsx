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
      <p className="section__eyebrow">{otherWorks.title}</p>

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

          {/* key forces a re-mount so the fade replays when switching category */}
          <div key={current.id} className="category-view">
            <div className="category-head">
              <h2 className="category-head__title">{current.name}</h2>
              <span className="category-head__count">
                {photos.length} photo{photos.length === 1 ? '' : 's'}
              </span>
            </div>

            <Gallery photos={photos} onSelect={setLightboxIndex} />
          </div>
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

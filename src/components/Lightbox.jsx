import { useEffect } from 'react'

export default function Lightbox({ photos, index, onClose, onNext, onPrev }) {
  const photo = photos[index]

  // Keyboard navigation: Esc to close, arrows to move.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onNext()
      else if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', onKey)
    // Prevent the page behind from scrolling while the lightbox is open.
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onNext, onPrev])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button
        className="lightbox__close"
        onClick={onClose}
        aria-label="Close"
      >
        &times;
      </button>

      <button
        className="lightbox__nav lightbox__nav--prev"
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
        aria-label="Previous photo"
      >
        &#8249;
      </button>

      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img src={photo.src} alt={photo.alt || ''} />
        {photo.alt && <figcaption>{photo.alt}</figcaption>}
      </figure>

      <button
        className="lightbox__nav lightbox__nav--next"
        onClick={(e) => {
          e.stopPropagation()
          onNext()
        }}
        aria-label="Next photo"
      >
        &#8250;
      </button>
    </div>
  )
}

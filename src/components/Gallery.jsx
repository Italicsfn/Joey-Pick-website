export default function Gallery({ photos, onSelect }) {
  if (!photos || photos.length === 0) {
    return (
      <p className="gallery__empty">
        No photos yet. Add images to <code>/public/photos</code> and list them in{' '}
        <code>config.js</code>.
      </p>
    )
  }

  return (
    <div className="gallery">
      {photos.map((photo, i) => (
        <button
          key={photo.src}
          className="gallery__item"
          onClick={() => onSelect(i)}
          aria-label={`Open photo: ${photo.alt || `photo ${i + 1}`}`}
        >
          <img
            src={photo.src}
            alt={photo.alt || ''}
            loading="lazy"
            decoding="async"
          />
        </button>
      ))}
    </div>
  )
}

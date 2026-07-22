import { useEffect, useRef, useState } from 'react'
import { site, otherWorks } from '../../config.js'

export default function Navbar({ categories, activeCategoryId, onSelectCategory }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hasCategories = Array.isArray(categories) && categories.length > 0

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <nav className="nav">
      <a className="nav__brand" href="#gallery">
        {site.title}
      </a>

      <div className="nav__links">
        <a href="#gallery">Gallery</a>

        {hasCategories && (
          <div className="nav__dropdown" ref={ref}>
            <button
              className="nav__dropbtn"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-haspopup="true"
            >
              {otherWorks.title}
              <span className="nav__caret" aria-hidden="true">
                ▾
              </span>
            </button>

            {open && (
              <div className="nav__menu" role="menu">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    role="menuitem"
                    className={
                      'nav__menuitem' +
                      (c.id === activeCategoryId ? ' is-active' : '')
                    }
                    onClick={() => {
                      onSelectCategory(c.id)
                      setOpen(false)
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <a href="#contact">Contact</a>
      </div>
    </nav>
  )
}

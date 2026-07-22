import { useEffect, useRef, useState } from 'react'
import { contact } from '../../config.js'
import { InstagramIcon, EmailIcon, TwitterIcon, LinkedInIcon } from './icons.jsx'

// Build the list of links to show, in order. Only include ones the user filled in.
function buildLinks() {
  const links = []
  if (contact.instagram)
    links.push({ label: 'Instagram', href: contact.instagram, Icon: InstagramIcon, external: true })
  if (contact.email)
    links.push({ label: 'Email', href: `mailto:${contact.email}`, Icon: EmailIcon, external: false })
  if (contact.twitter)
    links.push({ label: 'Twitter / X', href: contact.twitter, Icon: TwitterIcon, external: true })
  if (contact.linkedin)
    links.push({ label: 'LinkedIn', href: contact.linkedin, Icon: LinkedInIcon, external: true })
  return links
}

export default function ContactButton() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const links = buildLinks()

  // Close when clicking outside the widget or pressing Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
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
    <div id="contact" className="contact" ref={wrapRef}>
      {open && (
        <div className="contact__panel" role="menu">
          {links.map(({ label, href, Icon, external }) => (
            <a
              key={label}
              className="contact__link"
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              role="menuitem"
            >
              <Icon />
              <span>{label}</span>
            </a>
          ))}
        </div>
      )}

      <button
        className="contact__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close contact panel' : 'Open contact panel'}
      >
        {open ? '×' : 'Contact'}
      </button>
    </div>
  )
}

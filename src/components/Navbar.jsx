import { site, otherWorks } from '../../config.js'

export default function Navbar() {
  // Only show the "Other Works" link once that section is configured.
  const showOtherWorks =
    Boolean(otherWorks.apiKey) && otherWorks.folderIds?.length > 0

  return (
    <nav className="nav">
      <a className="nav__brand" href="#gallery">
        {site.title}
      </a>
      <div className="nav__links">
        <a href="#gallery">Gallery</a>
        {showOtherWorks && <a href="#other-works">{otherWorks.title}</a>}
        <a href="#contact">Contact</a>
      </div>
    </nav>
  )
}

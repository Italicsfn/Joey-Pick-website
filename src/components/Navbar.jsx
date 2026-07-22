import { site } from '../../config.js'

export default function Navbar() {
  return (
    <nav className="nav">
      <a className="nav__brand" href="#gallery">
        {site.title}
      </a>
      <div className="nav__links">
        <a href="#gallery">Gallery</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>
  )
}

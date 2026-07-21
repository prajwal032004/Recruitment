import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    { label: 'CAREERS', to: '/careers', active: true },
  ]

  return (
    <header className="mpc-header">
      <div className="mpc-header-container">
        <Link to="/careers" className="mpc-logo">
          <span className="mpc-logo-text">MPC</span>
          <span className="mpc-logo-sub">CLOUD CONSULTING</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="mpc-nav">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className={`mpc-nav-link ${l.active ? 'active' : ''}`}>
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3" style={{ marginLeft: '16px' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </div>
        </nav>

        {/* Mobile Toggle */}
        <button className="mpc-burger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      <div className={`mpc-mobile-nav ${menuOpen ? 'open' : ''}`}>
        {links.map((l) => (
          <Link 
            key={l.label} 
            to={l.to} 
            className={`mpc-nav-link ${l.active ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <div className="flex gap-3 mt-4">
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Sign Up
            </Link>
        </div>
      </div>
    </header>
  )
}

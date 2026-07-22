import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const links = [
    { label: 'CAREERS', to: '/careers', active: true },
  ]

  const getDashboardLink = (u) => {
    if (!u) return '/login'
    if (u.role === 'PLACEMENT_OFFICER' && u.college_slug) return `/${u.college_slug}`
    if (u.role === 'CANDIDATE') return '/app/my-applications'
    if (u.role === 'INTERVIEWER') return '/app/my-interviews'
    if (u.role === 'HR') return '/app/pipeline'
    return '/app/dashboard'
  }

  const getDashboardLabel = (u) => {
    if (!u) return 'Sign In'
    if (u.role === 'CANDIDATE') return 'My Applications'
    if (u.role === 'PLACEMENT_OFFICER') return 'College Portal'
    return 'Dashboard'
  }

  return (
    <header className="mpc-header">
      <div className="mpc-header-container">
        <Link to="/" className="mpc-logo">
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
          {user ? (
            <div className="flex gap-3" style={{ marginLeft: '16px', alignItems: 'center' }}>
              <Link to={getDashboardLink(user)} className="btn btn-primary btn-sm">
                {getDashboardLabel(user)}
              </Link>
              <button onClick={logout} className="btn btn-ghost btn-sm">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-3" style={{ marginLeft: '16px' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
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
        {user ? (
          <div className="flex gap-3 mt-4">
            <Link to={getDashboardLink(user)} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              {getDashboardLabel(user)}
            </Link>
            <button onClick={() => { logout(); setMenuOpen(false) }} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex gap-3 mt-4">
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

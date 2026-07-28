import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const MPC_LOGO = 'https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg'

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const links = [
    { label: 'CAREERS', to: '/careers', active: true },
    { label: 'MANAGER PORTAL', to: '/manager/engineering/login', active: false },
  ]

  const getDashboardLink = (u) => {
    if (!u) return '/login'
    if (u.role === 'DEPT_MANAGER' && u.department_slug) return `/manager/${u.department_slug}`
    if (u.role === 'PLACEMENT_OFFICER' && u.college_slug) return `/${u.college_slug}`
    if (u.role === 'CANDIDATE') return '/app/my-applications'
    if (u.role === 'INTERVIEWER') return '/app/my-interviews'
    if (u.role === 'HR') return '/app/pipeline'
    return '/app/dashboard'
  }

  const getDashboardLabel = (u) => {
    if (!u) return 'Sign In'
    if (u.role === 'DEPT_MANAGER') return 'Manager Portal'
    if (u.role === 'CANDIDATE') return 'My Applications'
    if (u.role === 'PLACEMENT_OFFICER') return 'College Portal'
    return 'Dashboard'
  }

  /* Lock body scroll */
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  /* Close on escape */
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      <style>{publicHeaderStyles}</style>
      <header className="ph-header">
        <div className="ph-container">
          <Link to="/" className="ph-logo-link" onClick={() => setMenuOpen(false)}>
            <img src={MPC_LOGO} alt="MPC Logo" className="ph-logo" />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="ph-desktop-nav">
            {links.map((l) => (
              <Link key={l.label} to={l.to} className={`ph-nav-link${l.active ? ' ph-nav-link--active' : ''}`}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <div className="ph-nav-actions">
                <Link to={getDashboardLink(user)} className="btn btn-primary btn-sm">
                  {getDashboardLabel(user)}
                </Link>
                <button onClick={logout} className="btn btn-ghost btn-sm">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="ph-nav-actions">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* ── Mobile Toggle ── */}
          <button className="ph-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Slide-down Panel ── */}
      <div className={`ph-mobile-panel${menuOpen ? ' ph-mobile-panel--open' : ''}`}>
        <div className="ph-mobile-panel-inner">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={`ph-mobile-link${l.active ? ' ph-mobile-link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span>{l.label}</span>
              <ChevronRight size={16} className="ph-mobile-link-arrow" />
            </Link>
          ))}

          <div className="ph-mobile-divider" />

          {user ? (
            <div className="ph-mobile-actions">
              <Link
                to={getDashboardLink(user)}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setMenuOpen(false)}
              >
                {getDashboardLabel(user)}
              </Link>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="ph-mobile-actions">
              <Link
                to="/login"
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Backdrop ── */}
      {menuOpen && (
        <div className="ph-backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </>
  )
}


/* ═══════════════════════════════════════════
   Public Header Premium Responsive Styles
   ═══════════════════════════════════════════ */
const publicHeaderStyles = `

.ph-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
}
.ph-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 24px;
}
.ph-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.ph-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  transition: opacity 0.2s ease;
}
.ph-logo:hover {
  opacity: 0.85;
}

/* ── Desktop Nav ── */
.ph-desktop-nav {
  display: flex;
  align-items: center;
  gap: 20px;
}
.ph-nav-link {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  padding: 6px 0;
  position: relative;
  transition: color 0.2s ease;
}
.ph-nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--brand-gradient);
  border-radius: 2px;
  transition: width 0.25s ease;
}
.ph-nav-link:hover {
  color: var(--brand-600);
}
.ph-nav-link:hover::after {
  width: 100%;
}
.ph-nav-link--active {
  color: var(--brand-600);
}
.ph-nav-link--active::after {
  width: 100%;
}
.ph-nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

/* ── Burger ── */
.ph-burger {
  display: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.ph-burger:hover {
  background: var(--brand-50);
  color: var(--brand-600);
  border-color: var(--brand-200);
}

/* ── Mobile Panel ── */
.ph-mobile-panel {
  position: fixed;
  top: 68px;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
  z-index: 45;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.25s ease;
  opacity: 0;
}
.ph-mobile-panel--open {
  max-height: 400px;
  opacity: 1;
}
.ph-mobile-panel-inner {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ph-mobile-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-2);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: all 0.2s ease;
}
.ph-mobile-link:hover {
  background: var(--brand-50);
  color: var(--brand-700);
}
.ph-mobile-link--active {
  background: var(--brand-50);
  color: var(--brand-600);
}
.ph-mobile-link-arrow {
  color: var(--text-3);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}
.ph-mobile-link:hover .ph-mobile-link-arrow {
  opacity: 0.7;
  transform: translateX(0);
}

.ph-mobile-divider {
  height: 1px;
  background: var(--border);
  margin: 8px 0;
}
.ph-mobile-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ── Backdrop ── */
.ph-backdrop {
  position: fixed;
  inset: 0;
  top: 68px;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(2px);
  z-index: 44;
  animation: ph-fade-in 0.2s ease;
}
@keyframes ph-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ═══ Tablet (≤ 900px) ═══ */
@media (max-width: 900px) {
  .ph-desktop-nav {
    display: none;
  }
  .ph-burger {
    display: grid;
  }
}

/* ═══ Mobile (≤ 480px) ═══ */
@media (max-width: 480px) {
  .ph-container {
    padding: 0 14px;
    height: 58px;
  }
  .ph-logo {
    height: 32px;
  }
  .ph-burger {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
  .ph-mobile-panel {
    top: 58px;
  }
  .ph-backdrop {
    top: 58px;
  }
  .ph-mobile-panel-inner {
    padding: 12px 14px 16px;
  }
  .ph-mobile-link {
    padding: 12px 14px;
    font-size: 12px;
  }
}
`

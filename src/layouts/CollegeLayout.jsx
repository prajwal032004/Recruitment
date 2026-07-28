import { useState, useEffect } from 'react'
import { NavLink, Outlet, useParams, useNavigate, Link } from 'react-router-dom'
import { Building2, Users, Briefcase, BarChart3, LogOut, Menu, X, MessageSquareText, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/UI'
import NotificationBell from '../components/NotificationBell'

const MPC_LOGO = 'https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg'

export default function CollegeLayout() {
  const { slug } = useParams()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  const items = [
    { to: `/${slug}`, label: 'Opportunities', icon: Briefcase, end: true },
    { to: `/${slug}/students`, label: 'Students', icon: Users },
    { to: `/${slug}/scorecard`, label: 'Scorecard', icon: BarChart3 },
    { to: `/${slug}/policy-assistant`, label: 'Policy Assistant', icon: MessageSquareText },
  ]
  const doLogout = () => { logout(); nav(`/${slug}/login`) }

  /* Lock body scroll when drawer open */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* Close on escape */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="shell">
      <style>{collegeStyles}</style>

      {/* ── Sidebar ── */}
      <aside className={`clg-sidebar ${open ? 'clg-sidebar--open' : ''}`}>
        <div className="clg-sidebar-header">
          <div className="clg-sidebar-brand">
            <img src={MPC_LOGO} alt="MPC Logo" className="clg-sidebar-logo" />
            <div>
              <div className="brand-name">College Portal</div>
              <div className="brand-sub">{slug}</div>
            </div>
          </div>
          <button className="clg-sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="clg-sidebar-nav">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `clg-nav-item${isActive ? ' clg-nav-item--active' : ''}`}>
              <it.icon size={18} />
              <span>{it.label}</span>
              <ChevronRight size={14} className="clg-nav-arrow" />
            </NavLink>
          ))}
          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <NavLink to="/app/dashboard" onClick={() => setOpen(false)} className="clg-nav-item clg-nav-back">
              <span style={{ display: 'flex', alignItems: 'center', gap: 11 }}>← Back to admin</span>
            </NavLink>
          )}
        </nav>

        <div className="clg-sidebar-footer">
          <button className="clg-logout-btn" onClick={doLogout}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main">
        <header className="clg-topbar">
          <div className="clg-topbar-left">
            <button className="clg-burger" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            {/* Mobile logo */}
            <Link to="/" className="clg-topbar-logo-link clg-show-mobile">
              <img src={MPC_LOGO} alt="MPC Logo" className="clg-topbar-logo-img" />
            </Link>
            <div className="clg-topbar-title-text clg-hide-mobile">Placement Portal</div>
            <div className="clg-topbar-title-mobile clg-show-mobile">{slug}</div>
          </div>
          <div className="clg-topbar-right">
            <NotificationBell />
            <div className="clg-user-pill">
              <Avatar name={user?.name} size={32} />
              <div className="clg-user-meta clg-hide-sm">
                <div className="clg-user-name">{user?.name}</div>
                <div className="clg-user-role">{user?.role === 'PLACEMENT_OFFICER' ? 'Placement Officer' : user?.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>

      {/* ── Backdrop ── */}
      <div
        className={`clg-backdrop${open ? ' clg-backdrop--visible' : ''}`}
        onClick={() => setOpen(false)}
      />
    </div>
  )
}


/* ═══════════════════════════════════════════
   College Layout Premium Responsive Styles
   ═══════════════════════════════════════════ */
const collegeStyles = `

/* ── Sidebar ── */
.clg-sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 40;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.clg-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  min-height: 64px;
  flex-shrink: 0;
}
.clg-sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.clg-sidebar-logo {
  height: 36px;
  width: auto;
  object-fit: contain;
}
.clg-sidebar-close {
  display: none;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
  place-items: center;
  cursor: pointer;
  transition: all 0.2s;
}
.clg-sidebar-close:hover {
  background: var(--red-50);
  color: var(--red-500);
  border-color: #fecaca;
}

.clg-sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.clg-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-weight: 600;
  font-size: 13.5px;
  text-decoration: none;
  transition: all 0.2s ease;
  width: 100%;
}
.clg-nav-item:hover {
  background: var(--brand-50);
  color: var(--brand-700);
  transform: translateX(3px);
}
.clg-nav-item--active {
  background: var(--brand-gradient);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(197, 48, 123, 0.28);
}
.clg-nav-item--active:hover {
  color: #ffffff;
  transform: none;
}
.clg-nav-back {
  margin-top: 8px;
  border-top: 1px solid var(--border);
  padding-top: 14px;
  color: var(--text-3);
  font-size: 13px;
}
.clg-nav-arrow {
  margin-left: auto;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.clg-nav-item:hover .clg-nav-arrow,
.clg-nav-item--active .clg-nav-arrow {
  opacity: 0.6;
  transform: translateX(0);
}

.clg-sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.clg-logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(239, 68, 68, 0.15);
  background: var(--red-50);
  color: var(--red-600);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.clg-logout-btn:hover {
  background: #fee2e2;
  border-color: rgba(239, 68, 68, 0.3);
}

/* ── Topbar ── */
.clg-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 20;
  gap: 12px;
}
.clg-topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.clg-burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.clg-burger:hover {
  background: var(--brand-50);
  color: var(--brand-600);
  border-color: var(--brand-200);
}
.clg-topbar-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.clg-topbar-logo-img {
  height: 30px;
  width: auto;
  object-fit: contain;
}
.clg-topbar-title-text {
  font-weight: 800;
  font-size: 18px;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.01em;
}
.clg-topbar-title-mobile {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  text-transform: capitalize;
}
.clg-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.clg-user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  background: var(--surface-2);
  border-radius: 100px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}
.clg-user-pill:hover {
  background: var(--surface);
  border-color: var(--border-2);
}
.clg-user-meta { min-width: 0; }
.clg-user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.clg-user-role {
  font-size: 10px;
  font-weight: 700;
  color: var(--brand-600);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Backdrop ── */
.clg-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 35;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.clg-backdrop--visible {
  opacity: 1;
  pointer-events: auto;
}

/* ── Visibility helpers ── */
.clg-show-mobile { display: none !important; }
.clg-hide-mobile { }
.clg-hide-sm { }

/* ═══ Mobile (≤ 768px) ═══ */
@media (max-width: 768px) {
  .clg-sidebar {
    position: fixed;
    z-index: 40;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    box-shadow: 8px 0 32px rgba(15, 23, 42, 0.15);
  }
  .clg-sidebar--open {
    transform: translateX(0);
  }
  .clg-sidebar-close {
    display: grid;
  }
  .clg-burger {
    display: inline-flex;
  }
  .clg-show-mobile {
    display: flex !important;
  }
  .clg-hide-mobile {
    display: none !important;
  }
  .clg-hide-sm {
    display: none !important;
  }
  .clg-topbar {
    padding: 0 12px;
    height: 56px;
  }
  .clg-user-pill {
    padding: 3px;
    border-radius: 50%;
  }
}

/* ═══ Small phone (≤ 480px) ═══ */
@media (max-width: 480px) {
  .clg-topbar {
    padding: 0 10px;
    height: 52px;
  }
  .clg-burger {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }
  .clg-topbar-logo-img {
    height: 26px;
  }
  .clg-topbar-title-mobile {
    font-size: 13px;
  }
  .clg-sidebar {
    width: 280px;
  }
  .clg-nav-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}
`

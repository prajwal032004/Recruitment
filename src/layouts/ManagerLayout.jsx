import { useState, useEffect } from 'react'
import { NavLink, Outlet, useParams, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, UserPlus, KanbanSquare, CalendarClock,
  MessageSquareText, LogOut, Menu, X, Building2, ChevronDown, CheckCircle2, UserCheck,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/UI'
import NotificationBell from '../components/NotificationBell'

const MPC_LOGO = 'https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg'

export default function ManagerLayout() {
  const { deptSlug } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const deptName = user?.department_name || slug.toUpperCase()

  const navItems = [
    { to: `/manager/${slug}`, label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: `/manager/${slug}/requests`, label: 'Hiring Requisitions', icon: ClipboardList },
    { to: `/manager/${slug}/candidates`, label: 'Candidate Verification', icon: UserCheck },
    { to: `/manager/${slug}/pipeline`, label: 'Recruitment Pipeline', icon: KanbanSquare },
  ]

  const doLogout = () => {
    logout()
    navigate(`/manager/${slug}/login`)
  }

  /* Lock body scroll when drawer open */
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  /* Close on escape */
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e) => e.key === 'Escape' && setSidebarOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  return (
    <div className="shell">
      <style>{managerStyles}</style>

      {/* ── Sidebar ── */}
      <aside className={`mgr-sidebar ${sidebarOpen ? 'mgr-sidebar--open' : ''}`}>
        {/* Header */}
        <div className="mgr-sidebar-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src={MPC_LOGO} alt="MPC Logo" className="mgr-sidebar-logo" />
          </Link>
          <button className="mgr-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Department Badge */}
        <div className="mgr-dept-badge">
          <div className="mgr-dept-eyebrow">Department Portal</div>
          <div className="mgr-dept-name">
            <Building2 size={16} color="#38bdf8" />
            <span>{deptName}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mgr-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `mgr-nav-item${isActive ? ' mgr-nav-item--active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <ChevronRight size={14} className="mgr-nav-arrow" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mgr-sidebar-footer">
          <button className="mgr-logout-btn" onClick={doLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main">
        {/* Topbar */}
        <header className="mgr-topbar">
          <div className="mgr-topbar-left">
            <button className="mgr-burger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            {/* Mobile logo */}
            <Link to="/" className="mgr-topbar-logo-link mgr-show-mobile">
              <img src={MPC_LOGO} alt="MPC Logo" className="mgr-topbar-logo-img" />
            </Link>
            <div className="mgr-topbar-meta mgr-hide-mobile">
              <div className="mgr-topbar-title">{deptName} Manager Workspace</div>
              <div className="mgr-topbar-subtitle">Hiring Requisitions & Candidate Verifications</div>
            </div>
            {/* Mobile title */}
            <div className="mgr-topbar-title-mobile mgr-show-mobile">{deptName}</div>
          </div>

          <div className="mgr-topbar-right">
            <NotificationBell />

            {/* User pill */}
            <div className="mgr-user-pill">
              <Avatar name={user?.name || 'Department Manager'} size={30} style={{ border: '2px solid #818cf8' }} />
              <div className="mgr-user-meta mgr-hide-sm">
                <div className="mgr-user-name">{user?.name || 'Manager'}</div>
                <div className="mgr-user-role">{user?.title || 'Dept Manager'}</div>
              </div>
            </div>

            {/* Dept badge — desktop */}
            <div className="mgr-topbar-dept-badge mgr-hide-mobile">
              <Building2 size={14} style={{ color: '#4338ca' }} />
              <span>{deptName} Portal</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content" style={{ padding: '20px 20px 40px 20px', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Backdrop ── */}
      <div
        className={`mgr-backdrop${sidebarOpen ? ' mgr-backdrop--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  )
}


/* ═══════════════════════════════════════════
   Manager Layout Premium Styles
   ═══════════════════════════════════════════ */
const managerStyles = `

/* ── Sidebar ── */
.mgr-sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: #0f172a;
  border-right: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 40;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.mgr-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #1e293b;
  min-height: 64px;
  flex-shrink: 0;
}
.mgr-sidebar-logo {
  height: 34px;
  width: auto;
  object-fit: contain;
}
.mgr-sidebar-close {
  display: none;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #94a3b8;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s;
}
.mgr-sidebar-close:hover {
  background: #334155;
  color: #f1f5f9;
}

.mgr-dept-badge {
  padding: 14px 20px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}
.mgr-dept-eyebrow {
  font-size: 10px;
  font-weight: 700;
  color: #818cf8;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.mgr-dept-name {
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.mgr-sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.mgr-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 8px;
  color: #94a3b8;
  font-weight: 600;
  font-size: 13.5px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}
.mgr-nav-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #c7d2fe;
}
.mgr-nav-item--active {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}
.mgr-nav-item--active:hover {
  color: #ffffff;
}
.mgr-nav-arrow {
  margin-left: auto;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.mgr-nav-item:hover .mgr-nav-arrow,
.mgr-nav-item--active .mgr-nav-arrow {
  opacity: 0.6;
  transform: translateX(0);
}

.mgr-sidebar-footer {
  padding: 16px;
  border-top: 1px solid #1e293b;
  flex-shrink: 0;
}
.mgr-logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mgr-logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.35);
}

/* ── Topbar ── */
.mgr-topbar {
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
.mgr-topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.mgr-burger {
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
.mgr-burger:hover {
  background: #eef2ff;
  color: #4f46e5;
  border-color: #c7d2fe;
}
.mgr-topbar-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.mgr-topbar-logo-img {
  height: 30px;
  width: auto;
  object-fit: contain;
}
.mgr-topbar-meta {
  min-width: 0;
}
.mgr-topbar-title {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mgr-topbar-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
}
.mgr-topbar-title-mobile {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
}
.mgr-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.mgr-user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  background: var(--surface-2);
  border-radius: 100px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}
.mgr-user-pill:hover {
  background: var(--surface);
  border-color: var(--border-2);
}
.mgr-user-meta { min-width: 0; }
.mgr-user-name {
  font-size: 12px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.mgr-user-role {
  font-size: 10px;
  font-weight: 700;
  color: #4f46e5;
  text-transform: uppercase;
}
.mgr-topbar-dept-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 20px;
  padding: 6px 14px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  color: #4f46e5;
  white-space: nowrap;
}

/* ── Backdrop ── */
.mgr-backdrop {
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
.mgr-backdrop--visible {
  opacity: 1;
  pointer-events: auto;
}

/* ── Visibility helpers ── */
.mgr-show-mobile { display: none !important; }
.mgr-hide-mobile { }
.mgr-hide-sm { }

/* ═══ Tablet (≤ 1024px) ═══ */
@media (max-width: 1024px) {
  .mgr-topbar {
    padding: 0 16px;
  }
  .mgr-topbar-dept-badge {
    display: none;
  }
}

/* ═══ Mobile (≤ 768px) ═══ */
@media (max-width: 768px) {
  /* Sidebar becomes drawer */
  .mgr-sidebar {
    position: fixed;
    z-index: 40;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    box-shadow: 8px 0 32px rgba(15, 23, 42, 0.15);
  }
  .mgr-sidebar--open {
    transform: translateX(0);
  }
  .mgr-sidebar-close {
    display: grid;
  }
  .mgr-burger {
    display: inline-flex;
  }
  .mgr-show-mobile {
    display: flex !important;
  }
  .mgr-hide-mobile {
    display: none !important;
  }
  .mgr-topbar {
    padding: 0 12px;
    height: 56px;
  }
  .mgr-topbar-left {
    gap: 10px;
  }
  .mgr-user-pill {
    padding: 3px;
    border-radius: 50%;
  }
  .mgr-hide-sm {
    display: none !important;
  }
}

/* ═══ Small phone (≤ 480px) ═══ */
@media (max-width: 480px) {
  .mgr-topbar {
    padding: 0 10px;
    height: 52px;
  }
  .mgr-burger {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }
  .mgr-topbar-logo-img {
    height: 26px;
  }
  .mgr-topbar-title-mobile {
    font-size: 13px;
  }
  .mgr-sidebar {
    width: 280px;
  }
  .mgr-nav-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}
`

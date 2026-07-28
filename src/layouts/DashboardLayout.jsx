import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, UserCog, Briefcase, Users, KanbanSquare,
  CalendarClock, BarChart3, ScrollText, ShieldCheck, Rocket, ClipboardList,
  LogOut, Menu, X, FileText, MessageSquareText, UserCheck, UserRoundCheck, TrendingUp,
  GraduationCap, BookOpen, Sliders, Award, Bell, ChevronRight, Home
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/UI'
import NotificationBell from '../components/NotificationBell'
import ErrorBoundary from '../components/ErrorBoundary'

const MPC_LOGO = 'https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg'

const NAV = {
  ADMIN: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/manager', label: 'Dept Managers', icon: Building2 },
    { to: '/app/pipeline', label: 'Recruitment Pipeline', icon: KanbanSquare },
    { to: '/app/applications', label: 'Applications', icon: FileText },
    { to: '/app/candidates', label: 'Candidates', icon: Users },
    { to: '/app/jobs', label: 'Jobs / JDs', icon: Briefcase },
    { to: '/app/colleges', label: 'Colleges', icon: Building2 },
    { to: '/app/placement-officers', label: 'Placement Officers', icon: UserCog },
    { to: '/app/interviewers', label: 'Interviewers', icon: UserCheck },
    { to: '/app/interviews', label: 'Interviews', icon: CalendarClock },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/joined', label: 'Joined Candidates', icon: UserRoundCheck },
    { to: '/app/employees', label: 'Employees', icon: Users },
    { to: '/app/drives', label: 'Placement Drives', icon: Rocket },
    { to: '/app/workforce', label: 'Workforce Planning', icon: TrendingUp },
    { to: '/app/data-quality', label: 'Data Quality', icon: ShieldCheck },
    { to: '/app/policy-assistant', label: 'HR Policy Storage', icon: MessageSquareText },
    { to: '/app/audit', label: 'Audit Log', icon: ScrollText },
  ],
  HR: [
    { to: '/app/manager', label: 'Dept Managers', icon: Building2 },
    { to: '/app/pipeline', label: 'Recruitment Pipeline', icon: KanbanSquare },
    { to: '/app/applications', label: 'Applications', icon: FileText },
    { to: '/app/candidates', label: 'Candidates', icon: Users },
    { to: '/app/jobs', label: 'Jobs / JDs', icon: Briefcase },
    { to: '/app/interviewers', label: 'Interviewers', icon: UserCheck },
    { to: '/app/interviews', label: 'Interviews', icon: CalendarClock },
    { to: '/app/my-interviews', label: 'My Interviews', icon: ClipboardList },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/joined', label: 'Joined Candidates', icon: UserRoundCheck },
    { to: '/app/employees', label: 'Employees', icon: Users },
    { to: '/app/workforce', label: 'Workforce Planning', icon: TrendingUp },
    { to: '/app/data-quality', label: 'Data Quality', icon: ShieldCheck },
    { to: '/app/policy-assistant', label: 'HR Policy Storage', icon: MessageSquareText },
  ],
  EMPLOYEE: [
    { to: '/app/my-profile', label: 'My Profile Details', icon: UserCog },
    { to: '/app/notifications', label: 'Notifications', icon: Bell },
    { to: '/app/policy-assistant', label: 'HR Policy Assistant', icon: MessageSquareText },
  ],
  CANDIDATE: [
    { to: '/app/my-profile', label: 'My Profile', icon: UserCog },
    { to: '/app/my-applications', label: 'My Applications', icon: FileText },
    { to: '/app/policy-assistant', label: 'HR Policy Assistant', icon: MessageSquareText },
    { to: '/careers', label: 'Browse Jobs', icon: Briefcase },
  ],
  INTERVIEWER: [
    { to: '/app/my-interviews', label: 'My Interviews', icon: ClipboardList },
  ],
}

/* ──────────────────────────────────────────────
   Shared mobile slide-out drawer
   ────────────────────────────────────────────── */
function MobileDrawer({ open, onClose, user, items, doLogout, title, subtitle }) {
  const drawerRef = useRef(null)

  /* Close on escape */
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* Lock body scroll */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div className={`dl-drawer-backdrop${open ? ' dl-drawer-backdrop--visible' : ''}`} onClick={onClose} />
      <aside className={`dl-drawer${open ? ' dl-drawer--open' : ''}`} ref={drawerRef}>
        {/* Header */}
        <div className="dl-drawer-header">
          <Link to="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center' }}>
            <img src={MPC_LOGO} alt="MPC Logo" className="dl-drawer-logo" />
          </Link>
          <button className="dl-drawer-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Portal title */}
        <div className="dl-drawer-title-section">
          <span className="dl-drawer-eyebrow">{subtitle || 'Portal'}</span>
          <span className="dl-drawer-portal-name">{title || 'Workspace'}</span>
        </div>

        {/* User info */}
        <div className="dl-drawer-user">
          <Avatar name={user?.name} src={user?.profile_image} size={40} style={{ border: '2px solid var(--brand-200)' }} />
          <div className="dl-drawer-user-meta">
            <div className="dl-drawer-user-name">{user?.name}</div>
            <div className="dl-drawer-user-role">{user?.employee_code || user?.email || user?.role}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="dl-drawer-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={onClose}
              className={({ isActive }) => `dl-drawer-item${isActive ? ' dl-drawer-item--active' : ''}`}
            >
              <it.icon size={18} />
              <span>{it.label}</span>
              <ChevronRight size={14} className="dl-drawer-item-arrow" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="dl-drawer-footer">
          <button className="dl-drawer-logout" onClick={() => { doLogout(); onClose() }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

/* ──────────────────────────────────────────────
   Responsive top-bar header for simple layouts
   ────────────────────────────────────────────── */
function TopBarHeader({ user, items, doLogout, title, subtitle, onMenuToggle }) {
  return (
    <header className="dl-topbar-header">
      <div className="dl-topbar-left">
        <button className="dl-topbar-burger" onClick={onMenuToggle} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <Link to="/" className="dl-topbar-logo-link">
          <img src={MPC_LOGO} alt="MPC Logo" className="dl-topbar-logo" />
        </Link>
        <div className="dl-topbar-divider dl-hide-mobile" />
        <div className="dl-topbar-meta dl-hide-mobile">
          <div className="dl-topbar-title">{title}</div>
          <div className="dl-topbar-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="dl-topbar-right">
        <NotificationBell />
        <div className="dl-topbar-user-pill">
          <Avatar name={user?.name} src={user?.profile_image} size={32} style={{ border: '2px solid var(--brand-200)' }} />
          <div className="dl-topbar-user-info dl-hide-sm">
            <div className="dl-topbar-user-name">{user?.name}</div>
            <div className="dl-topbar-user-role">{user?.employee_code || user?.email || user?.title || user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const items = NAV[user?.role] || []

  const doLogout = () => { logout(); nav('/login') }

  /* ── Employee Layout ── */
  if (user?.role === 'EMPLOYEE') {
    return (
      <div className="dl-simple-layout">
        <style>{layoutStyles}</style>
        <TopBarHeader
          user={user}
          items={items}
          doLogout={doLogout}
          title="Employee Training Portal"
          subtitle="My Assignments & Compliance Tracks"
          onMenuToggle={() => setDrawerOpen(true)}
        />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          items={items}
          doLogout={doLogout}
          title="Employee Portal"
          subtitle="Training & Compliance"
        />
        {/* Desktop horizontal nav */}
        <nav className="dl-horizontal-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `dl-hnav-item${isActive ? ' dl-hnav-item--active' : ''}`}
            >
              <it.icon size={16} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <main className="dl-simple-main">
          <Outlet />
        </main>
      </div>
    )
  }

  /* ── Interviewer Layout ── */
  if (user?.role === 'INTERVIEWER') {
    return (
      <div className="dl-simple-layout">
        <style>{layoutStyles}</style>
        <TopBarHeader
          user={user}
          items={items}
          doLogout={doLogout}
          title="Interviewer Workspace"
          subtitle="Assigned Evaluations"
          onMenuToggle={() => setDrawerOpen(true)}
        />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          items={items}
          doLogout={doLogout}
          title="Interviewer"
          subtitle="Evaluation Workspace"
        />
        <nav className="dl-horizontal-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `dl-hnav-item${isActive ? ' dl-hnav-item--active' : ''}`}
            >
              <it.icon size={16} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <main className="dl-simple-main">
          <Outlet />
        </main>
      </div>
    )
  }

  /* ── Candidate Layout ── */
  if (user?.role === 'CANDIDATE') {
    return (
      <div className="dl-simple-layout">
        <style>{layoutStyles}</style>
        <TopBarHeader
          user={user}
          items={items}
          doLogout={doLogout}
          title="Candidate Portal"
          subtitle="Applications & Profile"
          onMenuToggle={() => setDrawerOpen(true)}
        />
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          items={items}
          doLogout={doLogout}
          title="Candidate Portal"
          subtitle="Jobs & Applications"
        />
        <nav className="dl-horizontal-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `dl-hnav-item${isActive ? ' dl-hnav-item--active' : ''}`}
            >
              <it.icon size={16} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <main className="dl-simple-main">
          <Outlet />
        </main>
      </div>
    )
  }

  /* ── Admin / HR Sidebar Layout ── */
  return (
    <div className="shell">
      <style>{layoutStyles}</style>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" className="mpc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src={MPC_LOGO} alt="MPC Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto' }}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <it.icon size={18} /><span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="nav-item" onClick={doLogout}><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="topbar-title dl-hide-sm">{roleLabel(user?.role)}</div>
          {/* Mobile-only role badge */}
          <div className="dl-topbar-role-mobile dl-show-sm">{roleLabel(user?.role)}</div>
          <div className="topbar-right">
            <NotificationBell />
            <div className="topbar-user">
              <Avatar name={user?.name} src={user?.profile_image} size={34} />
              <div className="tu-meta dl-hide-sm">
                <div className="tu-name">{user?.name}</div>
                <div className="tu-role">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {sidebarOpen && <div className="backdrop mobile-only" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}

function roleLabel(role) {
  return { ADMIN: 'Administration', HR: 'Recruitment & HR', EMPLOYEE: 'Employee Portal', CANDIDATE: 'Candidate Portal' }[role] || 'Workspace'
}


/* ═══════════════════════════════════════════════════════════════
   Premium Responsive Layout Styles
   ═══════════════════════════════════════════════════════════════ */
const layoutStyles = `

/* ── Drawer Backdrop ── */
.dl-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.dl-drawer-backdrop--visible {
  opacity: 1;
  pointer-events: auto;
}

/* ── Slide-out Drawer ── */
.dl-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 300px;
  max-width: 85vw;
  background: #ffffff;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 8px 0 32px rgba(15, 23, 42, 0.15);
  transform: translateX(-100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.dl-drawer--open {
  transform: translateX(0);
}

.dl-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  min-height: 60px;
}
.dl-drawer-logo {
  height: 34px;
  width: auto;
  object-fit: contain;
}
.dl-drawer-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dl-drawer-close:hover {
  background: var(--red-50);
  color: var(--red-500);
  border-color: #fecaca;
}

.dl-drawer-title-section {
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--brand-50), #f8fafc);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.dl-drawer-eyebrow {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--brand-500);
  margin-bottom: 2px;
}
.dl-drawer-portal-name {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.02em;
}

.dl-drawer-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  flex-shrink: 0;
}
.dl-drawer-user-meta {
  min-width: 0;
}
.dl-drawer-user-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dl-drawer-user-role {
  font-size: 11px;
  font-weight: 600;
  color: var(--brand-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dl-drawer-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dl-drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  color: var(--text-2);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}
.dl-drawer-item:hover {
  background: var(--brand-50);
  color: var(--brand-700);
}
.dl-drawer-item--active {
  background: var(--brand-gradient);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(197, 48, 123, 0.25);
}
.dl-drawer-item--active:hover {
  color: #fff;
  background: var(--brand-gradient-hover);
}
.dl-drawer-item-arrow {
  margin-left: auto;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.dl-drawer-item:hover .dl-drawer-item-arrow,
.dl-drawer-item--active .dl-drawer-item-arrow {
  opacity: 0.7;
  transform: translateX(0);
}

.dl-drawer-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.dl-drawer-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: var(--red-50);
  color: var(--red-600);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dl-drawer-logout:hover {
  background: #fee2e2;
  border-color: rgba(239, 68, 68, 0.35);
}

/* ── Simple layout (Employee/Interviewer/Candidate) ── */
.dl-simple-layout {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* ── Responsive Top Bar Header ── */
.dl-topbar-header {
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
  z-index: 100;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}
.dl-topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}
.dl-topbar-burger {
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
.dl-topbar-burger:hover {
  background: var(--brand-50);
  color: var(--brand-600);
  border-color: var(--brand-200);
}
.dl-topbar-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.dl-topbar-logo {
  height: 36px;
  width: auto;
  object-fit: contain;
}
.dl-topbar-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}
.dl-topbar-meta {
  min-width: 0;
}
.dl-topbar-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dl-topbar-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dl-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.dl-topbar-user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px 4px 4px;
  background: var(--surface-2);
  border-radius: 100px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
  cursor: pointer;
}
.dl-topbar-user-pill:hover {
  background: var(--surface);
  border-color: var(--border-2);
}
.dl-topbar-user-info {
  min-width: 0;
}
.dl-topbar-user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.dl-topbar-user-role {
  font-size: 10px;
  font-weight: 700;
  color: var(--brand-500);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* ── Horizontal nav bar (desktop for simple layouts) ── */
.dl-horizontal-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 24px;
  height: 48px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex-shrink: 0;
}
.dl-horizontal-nav::-webkit-scrollbar { display: none; }

.dl-hnav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.dl-hnav-item:hover {
  background: var(--brand-50);
  color: var(--brand-700);
}
.dl-hnav-item--active {
  background: var(--brand-gradient);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(197, 48, 123, 0.25);
  font-weight: 700;
}

.dl-simple-main {
  flex: 1;
  max-width: 1320px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px;
}

/* ── Admin/HR topbar mobile enhancements ── */
.dl-topbar-role-mobile {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
}

/* ── Responsive visibility helpers ── */
.dl-hide-mobile { }
.dl-show-sm { display: none !important; }
.dl-hide-sm { }

/* ═══════════════════════════════════════════
   Tablet (≤ 1024px)
   ═══════════════════════════════════════════ */
@media (max-width: 1024px) {
  .dl-topbar-header {
    padding: 0 16px;
  }
  .dl-topbar-user-name {
    max-width: 100px;
  }
  .dl-simple-main {
    padding: 24px 20px;
  }
  .dl-horizontal-nav {
    padding: 0 16px;
  }
}

/* ═══════════════════════════════════════════
   Mobile (≤ 768px)
   ═══════════════════════════════════════════ */
@media (max-width: 768px) {
  /* Show hamburger, hide desktop-only elements */
  .dl-topbar-burger {
    display: inline-flex;
  }
  .dl-hide-mobile {
    display: none !important;
  }
  .dl-show-sm {
    display: block !important;
  }
  .dl-hide-sm {
    display: none !important;
  }

  /* Top bar adjustments */
  .dl-topbar-header {
    padding: 0 12px;
    height: 56px;
  }
  .dl-topbar-left {
    gap: 10px;
  }
  .dl-topbar-logo {
    height: 30px;
  }
  .dl-topbar-right {
    gap: 8px;
  }
  .dl-topbar-user-pill {
    padding: 3px;
    border-radius: 50%;
  }

  /* Hide horizontal nav on mobile (use drawer instead) */
  .dl-horizontal-nav {
    display: none;
  }

  /* Main content */
  .dl-simple-main {
    padding: 16px 14px;
  }

  /* Admin/HR sidebar topbar */
  .topbar .topbar-title {
    display: none;
  }
  .dl-topbar-role-mobile {
    font-size: 13px;
  }
}

/* ═══════════════════════════════════════════
   Small phone (≤ 480px)
   ═══════════════════════════════════════════ */
@media (max-width: 480px) {
  .dl-topbar-header {
    padding: 0 10px;
    height: 52px;
  }
  .dl-topbar-burger {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }
  .dl-topbar-logo {
    height: 26px;
  }
  .dl-topbar-right {
    gap: 6px;
  }
  .dl-topbar-user-pill {
    padding: 2px;
  }
  .dl-simple-main {
    padding: 12px 10px;
  }
  .dl-drawer {
    width: 280px;
  }
  .dl-drawer-item {
    padding: 11px 12px;
    font-size: 13px;
  }
}
`

import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, UserCog, Briefcase, Users, KanbanSquare,
  CalendarClock, BarChart3, ScrollText, ShieldCheck, Rocket, ClipboardList,
  LogOut, Menu, X, FileText, MessageSquareText, UserCheck, UserRoundCheck, TrendingUp
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/UI'
import NotificationBell from '../components/NotificationBell'

const NAV = {
  ADMIN: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    { to: '/app/drives', label: 'Placement Drives', icon: Rocket },
    { to: '/app/workforce', label: 'Workforce Planning', icon: TrendingUp },
    { to: '/app/data-quality', label: 'Data Quality', icon: ShieldCheck },
    { to: '/app/policy-assistant', label: 'HR Policy Storage', icon: MessageSquareText },
    { to: '/app/audit', label: 'Audit Log', icon: ScrollText },
  ],
  HR: [
    { to: '/app/pipeline', label: 'Recruitment Pipeline', icon: KanbanSquare },
    { to: '/app/applications', label: 'Applications', icon: FileText },
    { to: '/app/candidates', label: 'Candidates', icon: Users },
    { to: '/app/jobs', label: 'Jobs / JDs', icon: Briefcase },
    { to: '/app/interviewers', label: 'Interviewers', icon: UserCheck },
    { to: '/app/interviews', label: 'Interviews', icon: CalendarClock },
    { to: '/app/my-interviews', label: 'My Interviews', icon: ClipboardList },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/joined', label: 'Joined Candidates', icon: UserRoundCheck },
    { to: '/app/workforce', label: 'Workforce Planning', icon: TrendingUp },
    { to: '/app/data-quality', label: 'Data Quality', icon: ShieldCheck },
    { to: '/app/policy-assistant', label: 'HR Policy Storage', icon: MessageSquareText },
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

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const items = NAV[user?.role] || []

  const doLogout = () => { logout(); nav('/login') }

  if (user?.role === 'INTERVIEWER') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 32px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div className="flex" style={{ gap: 24, alignItems: 'center' }}>
            <Link to="/" className="mpc-logo" style={{ flexDirection: 'column', textDecoration: 'none' }}>
              <span className="mpc-logo-text" style={{ fontSize: 22, fontWeight: 800, color: '#c5307b', letterSpacing: 1, lineHeight: 1 }}>MPC</span>
              <span className="mpc-logo-sub" style={{ fontSize: 8, fontWeight: 700, color: '#333', letterSpacing: 0.5, marginTop: 2 }}>CLOUD CONSULTING</span>
            </Link>
            <div style={{ height: 28, width: 1, background: '#cbd5e1' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Interviewer Workspace</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Assigned Candidate Evaluations</div>
            </div>
          </div>

          <div className="flex" style={{ gap: 20, alignItems: 'center' }}>
            <NotificationBell />
            <div className="flex" style={{ gap: 10, alignItems: 'center', padding: '6px 14px', background: '#f1f5f9', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Avatar name={user?.name} size={30} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>{user?.title || 'Interviewer'}</div>
              </div>
            </div>
            <button onClick={doLogout} className="btn-ghost btn-sm flex" style={{ gap: 6, color: '#ef4444', fontWeight: 600 }}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{ padding: '24px' }}>
          <Link to="/" className="mpc-logo" style={{ flexDirection: 'column', textDecoration: 'none' }}>
            <span className="mpc-logo-text" style={{ fontSize: 24, fontWeight: 800, color: '#c5307b', letterSpacing: 1, lineHeight: 1 }}>MPC</span>
            <span className="mpc-logo-sub" style={{ fontSize: 9, fontWeight: 700, color: '#333', letterSpacing: 0.5, marginTop: 4 }}>CLOUD CONSULTING</span>
          </Link>
          <button className="icon-btn mobile-only" onClick={() => setOpen(false)} style={{ marginLeft: 'auto' }}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
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
          <button className="icon-btn mobile-only" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="topbar-title">{roleLabel(user?.role)}</div>
          <div className="topbar-right">
            <NotificationBell />
            <div className="topbar-user">
              <Avatar name={user?.name} size={34} />
              <div className="tu-meta">
                <div className="tu-name">{user?.name}</div>
                <div className="tu-role">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>

      {open && <div className="backdrop mobile-only" onClick={() => setOpen(false)} />}
    </div>
  )
}

function roleLabel(role) {
  return { ADMIN: 'Administration', HR: 'Recruitment', CANDIDATE: 'Candidate Portal' }[role] || 'Workspace'
}

import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, UserCog, Briefcase, Users, KanbanSquare,
  CalendarClock, BarChart3, ScrollText, ShieldCheck, Rocket, ClipboardList,
  LogOut, Menu, X, FileText, MessageSquareText, UserCheck, UserRoundCheck, TrendingUp,
  GraduationCap, BookOpen, Sliders, Award, Bell
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/UI'
import NotificationBell from '../components/NotificationBell'
import ErrorBoundary from '../components/ErrorBoundary'

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

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const items = NAV[user?.role] || []

  const doLogout = () => { logout(); nav('/login') }

  if (user?.role === 'EMPLOYEE') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 24px',
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex wrap" style={{ gap: 16, alignItems: 'center' }}>
            <Link to="/" className="mpc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            <div style={{ height: 24, width: 1, background: '#cbd5e1' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Employee Training Portal</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>My Assignments & Compliance Tracks</div>
            </div>
          </div>

          <div className="flex wrap" style={{ gap: 14, alignItems: 'center', marginLeft: 'auto' }}>
            <NotificationBell />
            <div
              className="flex"
              style={{
                gap: 10,
                alignItems: 'center',
                padding: '6px 14px',
                background: '#f8fafc',
                borderRadius: 24,
                border: '1px solid #e2e8f0',
              }}
            >
              <Avatar name={user?.name} src={user?.profile_image} size={34} style={{ border: '2px solid #fbcfe8' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#c5307b' }}>{user?.employee_code || user?.email}</div>
              </div>
            </div>

            <button onClick={doLogout} className="btn-ghost btn-sm flex" style={{ gap: 4, color: '#ef4444', fontWeight: 600, padding: '6px 12px' }}>
              <LogOut size={16} /> <span>Sign out</span>
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 24px' }}>
          <Outlet />
        </main>
      </div>
    )
  }

  if (user?.role === 'INTERVIEWER') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 20px',
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div className="flex wrap" style={{ gap: 16, alignItems: 'center' }}>
            <Link to="/" className="mpc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            <div style={{ height: 24, width: 1, background: '#cbd5e1' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Interviewer Workspace</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Assigned Evaluations</div>
            </div>
          </div>

          <div className="flex wrap" style={{ gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
            <NotificationBell />
            <div className="flex" style={{ gap: 8, alignItems: 'center', padding: '4px 10px', background: '#f1f5f9', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Avatar name={user?.name} src={user?.profile_image} size={28} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>{user?.title || 'Interviewer'}</div>
              </div>
            </div>
            <button onClick={doLogout} className="btn-ghost btn-sm flex" style={{ gap: 4, color: '#ef4444', fontWeight: 600, padding: '4px 10px' }}>
              <LogOut size={15} /> <span>Sign out</span>
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px' }}>
          <Outlet />
        </main>
      </div>
    )
  }

  if (user?.role === 'CANDIDATE') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <header style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 20px',
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div className="flex wrap" style={{ gap: 20, alignItems: 'center' }}>
            <Link to="/" className="mpc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            </Link>
            
            <nav className="flex wrap" style={{ gap: 6 }}>
              <NavLink to="/careers" className={({ isActive }) => `btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`} style={{ textDecoration: 'none', fontWeight: 600 }}>
                Browse Jobs
              </NavLink>
              <NavLink to="/app/my-applications" className={({ isActive }) => `btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`} style={{ textDecoration: 'none', fontWeight: 600 }}>
                My Applications
              </NavLink>
              <NavLink to="/app/my-profile" className={({ isActive }) => `btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`} style={{ textDecoration: 'none', fontWeight: 600 }}>
                My Profile
              </NavLink>
              <NavLink to="/app/policy-assistant" className={({ isActive }) => `btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`} style={{ textDecoration: 'none', fontWeight: 600 }}>
                HR Policy Assistant
              </NavLink>
            </nav>
          </div>

          <div className="flex wrap" style={{ gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
            <NotificationBell />
            <div className="flex" style={{ gap: 8, alignItems: 'center', padding: '4px 10px', background: '#f1f5f9', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Avatar name={user?.name} src={user?.profile_image} size={28} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#c5307b', textTransform: 'uppercase' }}>Candidate</div>
              </div>
            </div>
            <button onClick={doLogout} className="btn-ghost btn-sm flex" style={{ gap: 4, color: '#ef4444', fontWeight: 600, padding: '4px 10px' }}>
              <LogOut size={15} /> <span>Sign out</span>
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px' }}>
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" className="mpc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
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
              <Avatar name={user?.name} src={user?.profile_image} size={34} />
              <div className="tu-meta">
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

      {open && <div className="backdrop mobile-only" onClick={() => setOpen(false)} />}
    </div>
  )
}

function roleLabel(role) {
  return { ADMIN: 'Administration', HR: 'Recruitment & HR', EMPLOYEE: 'Employee Portal', CANDIDATE: 'Candidate Portal' }[role] || 'Workspace'
}

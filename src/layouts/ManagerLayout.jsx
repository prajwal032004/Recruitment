import { useState } from 'react'
import { NavLink, Outlet, useParams, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, UserPlus, KanbanSquare, CalendarClock,
  MessageSquareText, LogOut, Menu, X, Building2, ChevronDown, CheckCircle2, UserCheck
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/UI'
import NotificationBell from '../components/NotificationBell'

export default function ManagerLayout() {
  const { deptSlug } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const deptName = user?.department_name || slug.toUpperCase()

  const navItems = [
    { to: `/manager/${slug}`, label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: `/manager/${slug}/requests`, label: 'Hiring Requisitions', icon: ClipboardList },
    { to: `/manager/${slug}/candidates`, label: 'Candidate Verification', icon: UserCheck },
  ]

  const doLogout = () => {
    logout()
    navigate(`/manager/${slug}/login`)
  }

  const ALL_DEPTS = [
    { name: 'Engineering', slug: 'engineering' },
    { name: 'Finance', slug: 'finance' },
    { name: 'Marketing', slug: 'marketing' },
    { name: 'Sales', slug: 'sales' },
    { name: 'Human Resources', slug: 'hr' },
  ]

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`} style={{ background: '#0f172a', borderRight: '1px solid #1e293b' }}>
        <div className="sidebar-brand" style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: 34, objectFit: 'contain' }} />
          </Link>
          <button className="icon-btn mobile-only" onClick={() => setOpen(false)} style={{ marginLeft: 'auto', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {/* Department Badge */}
        <div style={{ padding: '14px 20px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Department Portal
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Building2 size={16} color="#38bdf8" />
            <span>{deptName}</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav" style={{ padding: '16px 12px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                color: isActive ? '#ffffff' : '#94a3b8',
                background: isActive ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : 'transparent',
                borderRadius: 8,
                margin: '2px 0',
                fontWeight: isActive ? 700 : 600,
              })}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-foot" style={{ padding: 16, borderTop: '1px solid #1e293b' }}>
          <button
            className="nav-item flex"
            onClick={doLogout}
            style={{ color: '#f87171', width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8 }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main">
        {/* Topbar Header */}
        <header className="topbar" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="icon-btn mobile-only" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>

            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {deptName} Manager Workspace
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                Hiring Requisitions, Candidate Pipelines & Interview Reviews
              </div>
            </div>
          </div>

          <div className="topbar-right flex" style={{ gap: 14, alignItems: 'center' }}>
            <NotificationBell />

            {/* User Meta */}
            <div className="flex" style={{ gap: 10, alignItems: 'center', background: '#f8fafc', padding: '4px 12px 4px 6px', borderRadius: 24, border: '1px solid #e2e8f0' }}>
              <Avatar name={user?.name || 'Department Manager'} size={32} style={{ border: '2px solid #818cf8' }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                  {user?.title || 'Dept Manager'}
                </div>
              </div>
            </div>

            {/* Department Switcher Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={slug}
                onChange={(e) => navigate(`/manager/${e.target.value}/login`)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  height: 36,
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#0f172a',
                  outline: 'none',
                  minWidth: 165
                }}
              >
                {ALL_DEPTS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name} Portal
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="content" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {open && <div className="backdrop mobile-only" onClick={() => setOpen(false)} />}
    </div>
  )
}

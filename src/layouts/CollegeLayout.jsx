import { useState } from 'react'
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom'
import { Building2, Users, Briefcase, BarChart3, LogOut, Menu, X, MessageSquareText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/UI'
import NotificationBell from '../components/NotificationBell'

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

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <div>
            <div className="brand-name">College Portal</div>
            <div className="brand-sub">{slug}</div>
          </div>
          <button className="icon-btn mobile-only" onClick={() => setOpen(false)} style={{ marginLeft: 'auto' }}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <it.icon size={18} /><span>{it.label}</span>
            </NavLink>
          ))}
          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <NavLink to="/app/dashboard" className="nav-item"><LayoutBack /></NavLink>
          )}
        </nav>
        <div className="sidebar-foot">
          <button className="nav-item" onClick={doLogout}><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="topbar-title">Placement Portal</div>
          <div className="topbar-right">
            <NotificationBell />
            <div className="topbar-user">
              <Avatar name={user?.name} size={34} />
              <div className="tu-meta">
                <div className="tu-name">{user?.name}</div>
                <div className="tu-role">{user?.role === 'PLACEMENT_OFFICER' ? 'Placement Officer' : user?.role}</div>
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

function LayoutBack() {
  return <span style={{ display: 'flex', alignItems: 'center', gap: 11 }}>← Back to admin</span>
}

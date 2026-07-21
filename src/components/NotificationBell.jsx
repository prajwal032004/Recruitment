import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Maximize2 } from 'lucide-react'
import { apiGet, apiPut } from '../api/client'
import { fmtDate } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ items: [], unread: 0 })
  const ref = useRef(null)
  const nav = useNavigate()
  const { user } = useAuth()

  const load = useCallback(() => {
    apiGet('/notifications').then(setData).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markAll = async () => { await apiPut('/notifications/read-all'); load() }
  const openItem = async (n) => {
    if (!n.is_read) { await apiPut(`/notifications/${n.id}/read`); load() }
    setOpen(false)
    if (n.link) nav(n.link)
  }

  const viewAll = () => {
    setOpen(false)
    const basePath = user?.role === 'PLACEMENT_OFFICER' ? `/${user?.college_slug}` : '/app'
    nav(`${basePath}/notifications`)
  }

  const topFour = data.items.slice(0, 4)

  return (
    <>
      <div className="notif-wrap" ref={ref}>
        <button className="icon-btn notif-btn" onClick={() => { setOpen((o) => !o); if (!open) load() }}>
          <Bell size={19} />
          {data.unread > 0 && <span className="notif-dot">{data.unread > 9 ? '9+' : data.unread}</span>}
        </button>
        {open && (
          <div className="notif-panel">
            <div className="notif-head" style={{ padding: '14px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <strong style={{ fontSize: '14px' }}>Notifications</strong>
              {data.unread > 0 && (
                <button className="link" onClick={markAll} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCheck size={13} /> Mark all read</button>
              )}
            </div>
            {data.items.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }} className="muted">No notifications yet</div>
            ) : (
              <>
                <div style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
                  {topFour.map((n) => (
                    <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`} onClick={() => openItem(n)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.is_read ? '#fff' : 'var(--brand-50)' }}>
                      <div className="notif-title" style={{ fontWeight: 600, fontSize: '13px', color: n.is_read ? 'var(--text)' : 'var(--brand-700)' }}>{n.title}</div>
                      <div className="notif-msg" style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', lineHeight: 1.4 }}>{n.message}</div>
                      <div className="notif-time" style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>{fmtDate(n.created_at)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', textAlign: 'center', flexShrink: 0 }}>
                  <button className="btn-soft btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', fontWeight: 600 }} onClick={viewAll}>
                    <Maximize2 size={14} /> View all {data.items.length} notifications
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

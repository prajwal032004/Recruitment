import { useFetch } from '../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader } from '../components/UI'
import { Bell, CheckCheck } from 'lucide-react'
import { apiPut } from '../api/client'
import { fmtDate } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'

export default function Notifications() {
  const { data, loading, error, refetch } = useFetch('/notifications')
  const nav = useNavigate()

  const markAll = async () => { 
    await apiPut('/notifications/read-all'); 
    refetch() 
  }
  
  const openItem = async (n) => {
    if (!n.is_read) { 
      await apiPut(`/notifications/${n.id}/read`); 
      refetch() 
    }
    if (n.link) nav(n.link)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const items = data?.items || []
  const unread = data?.unread || 0

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`You have ${unread} unread messages.`} icon={Bell} 
        actions={
          unread > 0 && (
            <button className="btn-soft" onClick={markAll}>
              <CheckCheck size={16} style={{ marginRight: 6 }} /> Mark all read
            </button>
          )
        } 
      />

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" message="You're all caught up." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((n) => (
              <div 
                key={n.id} 
                className={`notif-item ${n.is_read ? '' : 'unread'}`} 
                onClick={() => openItem(n)} 
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid var(--border)', 
                  cursor: 'pointer', 
                  background: n.is_read ? '#fff' : 'var(--brand-50)', 
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '16px', color: n.is_read ? 'var(--text)' : 'var(--brand-700)' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-3)', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                    {fmtDate(n.created_at)}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  {n.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

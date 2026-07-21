import { ScrollText } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge } from '../../components/UI'
import { fmtDate } from '../../utils/helpers'

export default function Audit() {
  const { data, loading, error, refetch } = useFetch('/admin/audit')
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const items = data?.items || []
  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every important action across the platform." icon={ScrollText} />
      {items.length === 0 ? <EmptyState icon={ScrollText} title="No activity logged yet" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data">
            <thead><tr><th>When</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>Detail</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="muted">{fmtDate(a.created_at)}</td>
                  <td>{a.user}</td>
                  <td>{a.role && <Badge variant="badge-gray">{a.role}</Badge>}</td>
                  <td><Badge variant="badge-blue">{a.action}</Badge></td>
                  <td className="muted">{a.entity_type}{a.entity_id ? ` #${a.entity_id}` : ''}</td>
                  <td className="muted">{a.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

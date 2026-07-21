import { Link } from 'react-router-dom'
import { FileText, Briefcase } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge } from '../../components/UI'
import { fmtDate } from '../../utils/helpers'

export default function MyApplications() {
  const { data, loading, error, refetch } = useFetch('/my-applications')
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const items = data?.items || []
  return (
    <div>
      <PageHeader title="My Applications" subtitle="Track the status of every role you've applied to." icon={FileText} />
      {items.length === 0 ? (
        <EmptyState icon={Briefcase} title="No applications yet"
          message="Browse open roles and apply." action={<Link className="btn-primary" to="/careers">Browse jobs</Link>} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data">
            <thead><tr><th>Role</th><th>Company</th><th>Applied</th><th>Stage</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.job_title}</strong></td>
                  <td className="muted">{a.company || '—'}</td>
                  <td className="muted">{fmtDate(a.applied_at)}</td>
                  <td><Badge variant="badge-blue">{a.stage}</Badge></td>
                  <td><Badge variant={a.status === 'Rejected' ? 'badge-red' : a.status === 'On Hold' ? 'badge-amber' : 'badge-green'}>{a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

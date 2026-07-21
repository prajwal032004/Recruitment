import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, PageHeader, StatCard, Badge } from '../../components/UI'

export default function DataQuality() {
  const { data, loading, error, refetch } = useFetch('/admin/data-quality')
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const issues = data?.issues || []
  const sev = { high: 'badge-red', medium: 'badge-amber', low: 'badge-gray' }
  return (
    <div>
      <PageHeader title="Data Quality" subtitle="Detect problems before they affect analytics." icon={ShieldCheck} />
      <div className="grid-stats mb-4">
        <StatCard icon={AlertTriangle} label="Total issues" value={data?.total_issues ?? 0} tone={data?.total_issues ? 'amber' : 'green'} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="data">
          <thead><tr><th>Issue</th><th>Records affected</th><th>Severity</th></tr></thead>
          <tbody>
            {issues.map((i, idx) => (
              <tr key={idx}>
                <td>{i.issue}</td>
                <td><strong>{i.count}</strong></td>
                <td><Badge variant={sev[i.severity] || 'badge-gray'}>{i.severity}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted mt-4">These checks run live against current data. Resolve high-severity issues (like duplicate emails) first.</p>
    </div>
  )
}

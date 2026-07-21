import { useNavigate } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge } from '../../components/UI'
import { fmtDate } from '../../utils/helpers'

export default function Interviews() {
  const { data, loading, error, refetch } = useFetch('/interviews')
  const nav = useNavigate()
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const items = data || []
  return (
    <div>
      <PageHeader title="Interviews" subtitle="All scheduled interviews and their feedback status." icon={CalendarClock} />
      {items.length === 0 ? <EmptyState icon={CalendarClock} title="No interviews scheduled"
        message="Schedule interviews from a candidate's application detail page." /> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data">
            <thead><tr><th>Candidate</th><th>Role</th><th>Round</th><th>When</th><th>Interviewers</th><th>Feedback</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((iv) => (
                <tr key={iv.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/app/applications/${iv.application_id}`)}>
                  <td><strong>{iv.candidate_name}</strong></td>
                  <td className="muted">{iv.job_title}</td>
                  <td>{iv.round_name}</td>
                  <td className="muted">{iv.scheduled_at ? fmtDate(iv.scheduled_at) : 'TBD'}</td>
                  <td className="muted">{iv.interviewers.map((x) => x.name).join(', ')}</td>
                  <td><Badge variant={iv.feedback_count > 0 ? 'badge-green' : 'badge-gray'}>{iv.feedback_count} / {iv.interviewers.length}</Badge></td>
                  <td><Badge variant={iv.status === 'Completed' ? 'badge-green' : 'badge-blue'}>{iv.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { Briefcase, Users, Send, FileCheck } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, StatCard, Badge } from '../../components/UI'
import { fmtDate } from '../../utils/helpers'

export default function CollegePortal() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { data, loading, error, refetch } = useFetch(`/college/${slug}`)
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const s = data?.stats || {}
  const jobs = data?.assigned_jobs || []

  return (
    <div>
      <PageHeader title={data?.college?.name || 'College Portal'} subtitle="Opportunities shared with your college." icon={Briefcase} />
      <div className="grid-stats mb-4">
        <StatCard icon={Briefcase} label="Assigned JDs" value={s.assigned_jobs ?? 0} tone="brand" />
        <StatCard icon={Users} label="Students" value={s.students ?? 0} tone="violet" />
        <StatCard icon={Send} label="Submitted" value={s.submitted ?? 0} tone="blue" />
        <StatCard icon={FileCheck} label="With resume" value={s.students_with_resume ?? 0} tone="green" />
      </div>

      <h3 className="mb-4">Active Opportunities</h3>
      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No opportunities yet"
          message="When the admin assigns a job to your college, it will appear here." />
      ) : (
        <div className="grid-cards">
          {jobs.map((a) => (
            <div key={a.id} className="card card-pad" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => nav(`/${slug}/jobs/${a.job_id}`)}>
              <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                <strong style={{ fontSize: 16, lineHeight: 1.2 }}>{a.job_title}</strong>
                <Badge variant="badge-blue">{a.students_submitted} submitted</Badge>
              </div>
              <p className="muted" style={{ fontSize: 13, flex: 1 }}>Shared {fmtDate(a.assigned_at)}</p>
              <button className="btn-primary btn-sm btn-block mt-4">View & Submit Students</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

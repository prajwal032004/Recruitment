import { useParams } from 'react-router-dom'
import { BarChart3, Users, Send, Award, CheckCircle2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, PageHeader, StatCard } from '../../components/UI'

export default function CollegeScorecard() {
  const { slug } = useParams()
  const { data, loading, error, refetch } = useFetch(`/college/${slug}/scorecard`, [slug])
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  return (
    <div>
      <PageHeader title="Placement Scorecard" subtitle="Your college's recruitment performance." icon={BarChart3} />
      <div className="grid-stats mb-4">
        <StatCard icon={Send} label="JDs Assigned" value={data?.jds_assigned ?? 0} tone="brand" />
        <StatCard icon={Users} label="Students Submitted" value={data?.students_submitted ?? 0} tone="violet" />
        <StatCard icon={CheckCircle2} label="Eligible" value={data?.eligible ?? 0} tone="blue" />
        <StatCard icon={CheckCircle2} label="Shortlisted" value={data?.shortlisted ?? 0} tone="amber" />
        <StatCard icon={Award} label="Offered" value={data?.offered ?? 0} tone="green" />
        <StatCard icon={Award} label="Joined" value={data?.joined ?? 0} tone="green" />
        <StatCard icon={BarChart3} label="Conversion" value={`${data?.conversion ?? 0}%`} tone="brand" />
        <StatCard icon={Users} label="Avg CGPA" value={data?.avg_cgpa ?? 0} tone="violet" />
      </div>

      <h3 className="mb-4 mt-6">Recruitment Funnel (EDA)</h3>
      <div className="card card-pad" style={{ height: 360 }}>
        {data?.funnel_data && data.funnel_data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.funnel_data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 13, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 13, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', fontWeight: 600 }}
              />
              <Bar dataKey="value" fill="var(--brand-500)" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="muted flex" style={{ height: '100%', justifyContent: 'center' }}>No funnel data available yet.</div>
        )}
      </div>
    </div>
  )
}

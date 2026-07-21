import { BarChart3, ArrowRight } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge } from '../../components/UI'

export default function Analytics() {
  const { data: funnel, loading } = useFetch('/analytics/funnel')
  const { data: sources } = useFetch('/analytics/sources')
  const { data: colleges } = useFetch('/analytics/colleges')
  const { data: skills } = useFetch('/analytics/skills')

  if (loading) return <LoadingSpinner />
  const hasData = funnel?.has_data

  return (
    <div>
      <PageHeader title="Recruitment Analytics" subtitle="Conversion funnels, source effectiveness, and college performance." icon={BarChart3} />

      {!hasData ? (
        <EmptyState icon={BarChart3} title="No data to analyse yet"
          message="Analytics populate automatically as applications and outcomes accumulate." />
      ) : (
        <>
          <div className="two-col">
            <div className="card card-pad" style={{ background: 'linear-gradient(145deg, var(--surface), var(--surface-2))' }}>
              <h3 className="mb-4">Conversion Funnel</h3>
              {(funnel?.stages || []).map((s) => (
                <div key={s.label} className="mb-4">
                  <div className="row-between mb-2">
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <strong>{s.count} <span className="muted" style={{ fontWeight: 500 }}>({s.rate}%)</span></strong>
                  </div>
                  <div className="progress" style={{ height: 10, background: 'var(--border)' }}>
                    <span style={{ width: `${s.rate}%`, background: 'linear-gradient(90deg, var(--brand-400), var(--brand-600))' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="card card-pad">
              <h3 className="mb-4">Stage Conversions</h3>
              {Object.entries(funnel?.conversions || {}).map(([k, v]) => {
                const parts = k.split('_to_')
                return (
                  <div key={k} className="row-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{parts[0]}</span>
                      <ArrowRight size={14} className="muted" />
                      <span style={{ fontWeight: 500 }}>{parts[1]}</span>
                    </div>
                    <Badge variant="badge-blue" style={{ fontSize: 13, padding: '4px 10px' }}>{v}%</Badge>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card card-pad mt-4">
            <h3 className="mb-4">Source Effectiveness</h3>
            <table className="data">
              <thead><tr><th>Source</th><th>Applications</th><th>Offers</th><th>Joined</th><th>Offer rate</th></tr></thead>
              <tbody>
                {(sources?.items || []).map((s) => (
                  <tr key={s.source}><td><Badge variant="badge-gray">{s.source}</Badge></td>
                    <td>{s.applications}</td><td>{s.offers}</td><td>{s.joined}</td><td><strong>{s.offer_rate}%</strong></td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card card-pad mt-4">
            <h3 className="mb-4">College Performance Scorecard</h3>
            {(colleges?.items || []).length === 0 ? <p className="muted">No colleges with activity yet.</p> : (
              <table className="data">
                <thead><tr><th>College</th><th>JDs</th><th>Students</th><th>Submitted</th><th>Shortlisted</th><th>Offered</th><th>Joined</th><th>Conversion</th></tr></thead>
                <tbody>
                  {colleges.items.map((c) => (
                    <tr key={c.college_id}><td><strong>{c.college}</strong></td><td>{c.jds_assigned}</td><td>{c.students}</td>
                      <td>{c.submitted}</td><td>{c.shortlisted}</td><td>{c.offered}</td><td>{c.joined}</td>
                      <td><Badge variant="badge-green">{c.conversion}%</Badge></td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {(skills?.top_skills || []).length > 0 && (
            <div className="card card-pad mt-4">
              <h3 className="mb-4">Top Candidate Skills</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skills.top_skills} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="skill" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}

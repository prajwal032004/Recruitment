import { Users, Briefcase, Building2, CalendarClock, Award, GraduationCap, FileText, TrendingUp, ArrowRight, UserRoundCheck, ClipboardList, CheckCircle2, Clock, UserPlus, Layers } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useFetch, CHART_COLORS } from '../../components/hooks'
import { LoadingSpinner, ErrorState, StatCard, PageHeader, EmptyState, Badge } from '../../components/UI'

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useFetch('/analytics/executive')
  const { data: funnel } = useFetch('/analytics/funnel')
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const k = data?.kpis || {}

  return (
    <div>
      <PageHeader title="Executive & HR Command Center" subtitle="Unified workspace for recruitment, workforce onboarding, training compliance, and employee operations." icon={TrendingUp} />

      {/* HR Command Center Quick Hub */}
      <div className="card mb-6" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)', border: '1px solid #fbcfe8', borderRadius: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          ⚡ Executive Quick Hub & Operations
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <a href="/app/managers" className="btn-soft flex" style={{ gap: 10, justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1px solid var(--border)' }}>
            <ClipboardList size={20} color="var(--brand-500)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>Manager Requisitions</div>
              <div className="muted" style={{ fontSize: 11 }}>Assign Students & Track Status</div>
            </div>
          </a>
          <a href="/app/jobs" className="btn-soft flex" style={{ gap: 10, justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1px solid var(--border)' }}>
            <Briefcase size={20} color="var(--brand-500)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>Jobs & Custom JDs</div>
              <div className="muted" style={{ fontSize: 11 }}>Admin & Requisition JDs</div>
            </div>
          </a>
          <a href="/app/pipeline" className="btn-soft flex" style={{ gap: 10, justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1px solid var(--border)' }}>
            <Layers size={20} color="var(--brand-500)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>Recruitment Pipeline</div>
              <div className="muted" style={{ fontSize: 11 }}>Multiple Pipelines per JD</div>
            </div>
          </a>
          <a href="/app/joined" className="btn-soft flex" style={{ gap: 10, justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1px solid var(--border)' }}>
            <UserRoundCheck size={20} color="var(--brand-500)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>Joined Candidates</div>
              <div className="muted" style={{ fontSize: 11 }}>Convert & Manage Undos</div>
            </div>
          </a>
        </div>
      </div>

      <div className="grid-stats mb-4">
        <StatCard icon={Users} label="Candidates" value={k.candidates ?? 0} tone="brand" />
        <StatCard icon={FileText} label="Applications" value={k.applications ?? 0} tone="violet" />
        <StatCard icon={Briefcase} label="Published JDs" value={k.open_jobs ?? 0} tone="blue" />
        <StatCard icon={Building2} label="Colleges" value={k.colleges ?? 0} tone="green" />
        <StatCard icon={GraduationCap} label="Students" value={k.students ?? 0} tone="amber" />
        <StatCard icon={CalendarClock} label="Interviews" value={k.interviews ?? 0} tone="blue" />
        <StatCard icon={Award} label="Offers" value={k.offers ?? 0} tone="green" />
        <StatCard icon={Award} label="Joined" value={k.joined ?? 0} tone="brand" />
      </div>

      {!data?.has_data ? (
        <EmptyState icon={FileText} title="No recruitment activity yet"
          message="Create jobs, assign them to colleges or publish to Careers, and applications will appear here." />
      ) : (
        <div className="two-col mt-6">
          <div className="card card-pad stack" style={{ minHeight: 450 }}>
            <h3 className="h2 mb-6" style={{ fontSize: 18 }}>Pipeline Candidates by Stage</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.by_stage} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorStage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--brand-600)" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--text-3)' }} interval={0} angle={-30} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="count" fill="url(#colorStage)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card card-pad stack" style={{ minHeight: 450 }}>
            <h3 className="h2 mb-4" style={{ fontSize: 18 }}>Applications by Source</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={(data.by_source || []).filter(d => d.count > 0)} dataKey="count" nameKey="source" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}>
                  {(data.by_source || []).filter(d => d.count > 0).map((entry, i) => {
                    const originalIndex = data.by_source.findIndex(d => d.source === entry.source);
                    return <Cell key={i} fill={CHART_COLORS[originalIndex % CHART_COLORS.length]} stroke="none" />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend payload={(data.by_source || []).map((entry, i) => ({ id: entry.source, type: 'circle', value: entry.source, color: CHART_COLORS[i % CHART_COLORS.length] }))} iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>

            {funnel?.conversions && (
              <div className="mt-6" style={{ background: 'var(--surface-2)', padding: 18, borderRadius: 14 }}>
                <h4 className="h2 mb-4" style={{ fontSize: 14.5 }}>Conversion Rates</h4>
                <div className="stack" style={{ gap: 10 }}>
                  {Object.entries(funnel.conversions).map(([k2, v]) => {
                    const [from, to] = k2.split('_to_')
                    return (
                      <div className="flex row-between" key={k2} style={{ padding: '8px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border-2)' }}>
                        <div className="flex" style={{ gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                          <span style={{ textTransform: 'capitalize' }}>{from}</span>
                          <ArrowRight size={14} color="var(--brand-400)" />
                          <span style={{ textTransform: 'capitalize', color: 'var(--text)' }}>{to}</span>
                        </div>
                        <Badge variant={v >= 50 ? 'badge-green' : v >= 25 ? 'badge-blue' : 'badge-gray'} style={{ fontSize: 12, fontWeight: 700 }}>
                          {v}%
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

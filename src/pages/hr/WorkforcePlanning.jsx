import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, Target, Briefcase, Users, Clock, AlertTriangle,
  ArrowDown, BarChart3, Zap, Layers, Calculator, Activity, Lightbulb
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, ReferenceLine, Area, AreaChart
} from 'recharts'
import { useFetch, CHART_COLORS } from '../../components/hooks'
import { apiGet } from '../../api/client'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, StatCard, Badge } from '../../components/UI'

export default function WorkforcePlanning() {
  const { data: overview, loading, error, refetch } = useFetch('/workforce/overview')
  const [metric, setMetric] = useState('applications')
  const [horizon, setHorizon] = useState(6)
  const [forecastData, setForecastData] = useState(null)
  const [forecastLoading, setForecastLoading] = useState(false)

  const [demandData, setDemandData] = useState(null)
  const [targetHires, setTargetHires] = useState(10)
  const [planData, setPlanData] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)


  const loadForecast = useCallback(async () => {
    setForecastLoading(true)
    try {
      const d = await apiGet(`/workforce/forecast?metric=${metric}&months=${horizon}`)
      setForecastData(d)
    } catch { setForecastData(null) }
    finally { setForecastLoading(false) }
  }, [metric, horizon])

  useEffect(() => { loadForecast() }, [loadForecast])

  useEffect(() => {
    apiGet('/workforce/demand').then(d => setDemandData(d)).catch(() => {})
  }, [])

  const loadPlan = useCallback(async () => {
    if (targetHires < 1) return
    setPlanLoading(true)
    try {
      const d = await apiGet(`/workforce/planning?target=${targetHires}`)
      setPlanData(d)
    } catch { setPlanData(null) }
    finally { setPlanLoading(false) }
  }, [targetHires])

  useEffect(() => { loadPlan() }, [loadPlan])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const hasData = overview?.has_data

  if (!hasData) {
    return (
      <div className="wfp">
        <PageHeader title="Workforce Planning" subtitle="Forward-looking hiring intelligence." icon={TrendingUp} />
        <EmptyState
          icon={TrendingUp}
          title="Not enough recruitment history yet"
          message="Data appears here as applications and hires accumulate. Start by creating jobs and processing applications."
        />
      </div>
    )
  }

  const kpi = overview?.kpis || {}
  const rates = overview?.conversion_rates || {}
  const chartData = buildChartData(forecastData)

  const FUNNEL_STEPS = [
    { label: 'Applications', key: 'applications', icon: Layers, color: '#6366f1', bg: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' },
    { label: 'Shortlisted', key: 'shortlisted', icon: Zap, color: '#8b5cf6', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' },
    { label: 'Interviewed', key: 'interviewed', icon: Activity, color: '#ec4899', bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)' },
    { label: 'Offered', key: 'offered', icon: Target, color: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
    { label: 'Joined', key: 'joined', icon: Users, color: '#10b981', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
  ]

  return (
    <div className="wfp">
      <PageHeader
        title="Workforce Planning"
        subtitle="Trend-based forecasting and pipeline capacity analysis."
        icon={TrendingUp}
      />

      {/* ─── KPI Row ─── */}
      <div className="wfp-kpi-grid">
        <StatCard icon={Briefcase} label="Open Positions" value={kpi.open_positions ?? '—'}
          sub={`Across ${kpi.total_open_jobs ?? 0} published jobs`} tone="brand" />
        <StatCard icon={Users} label="Projected Joins" value={kpi.projected_joins ?? '—'}
          sub="From current active pipeline" tone="green" />
        <StatCard icon={Target} label="Projected Gap" value={kpi.projected_gap ?? '—'}
          sub="Positions − projected joins" tone={kpi.projected_gap > 0 ? 'red' : 'green'} />
        <StatCard icon={Clock} label="Avg Time-to-Fill"
          value={kpi.avg_time_to_fill != null ? `${kpi.avg_time_to_fill}d` : '—'}
          sub="Average days to join" tone="amber" />
      </div>

      {/* ─── Hiring Forecast ─── */}
      <div className="wfp-section">
        <div className="wfp-section-header">
          <div className="wfp-section-title">
            <div className="wfp-section-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <BarChart3 size={18} />
            </div>
            <div>
              <h3>Hiring Forecast</h3>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {forecastData?.reliable ? 'Linear regression model' : 'Trend-based projection'}
              </span>
            </div>
          </div>
          <div className="wfp-controls">
            <div className="toggle-group">
              {['applications', 'hires'].map(m => (
                <button key={m} className={`toggle-btn ${metric === m ? 'active' : ''}`}
                  onClick={() => setMetric(m)}>
                  {m === 'applications' ? 'Applications' : 'Hires'}
                </button>
              ))}
            </div>
            <select className="wfp-select" value={horizon}
              onChange={e => setHorizon(Number(e.target.value))}>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>
        </div>

        {forecastData && !forecastData.reliable && forecastData.method !== 'insufficient_data' && (
          <div className="wfp-alert wfp-alert-amber">
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>Limited history — shown as a trend view, not a confident forecast.</span>
            <Badge variant="badge-amber">{forecastData.method.replace('_', ' ')}</Badge>
          </div>
        )}

        {forecastData?.method === 'insufficient_data' ? (
          <div className="wfp-alert wfp-alert-red">
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>Not enough data points to generate a forecast. Continue adding recruitment data.</span>
          </div>
        ) : (
          <div className="wfp-chart-wrap" style={{ height: 280, marginTop: 16 }}>
            {forecastLoading ? <LoadingSpinner label="Computing forecast…" /> : (
              chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS[2]} stopOpacity={0.12} />
                        <stop offset="100%" stopColor={CHART_COLORS[2]} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="history" name="Actual" stroke={CHART_COLORS[0]}
                      strokeWidth={2.5} fill="url(#histGrad)" dot={{ r: 4, fill: '#fff', stroke: CHART_COLORS[0], strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: CHART_COLORS[0] }} connectNulls={false} />
                    <Area type="monotone" dataKey="forecast" name="Forecast" stroke={CHART_COLORS[2]}
                      strokeWidth={2.5} strokeDasharray="8 4" fill="url(#fcGrad)"
                      dot={{ r: 4, fill: '#fff', stroke: CHART_COLORS[2], strokeWidth: 2, strokeDasharray: '' }}
                      connectNulls={false} />
                    {forecastData?.forecast?.length > 0 && (
                      <ReferenceLine x={forecastData.forecast[0].month}
                        stroke="var(--text-3)" strokeDasharray="4 4" strokeWidth={1} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="muted" style={{ textAlign: 'center', padding: 40 }}>No data to chart.</p>
            )}
          </div>
        )}

        {forecastData?.reliable && (
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Badge variant="badge-green">✓ {forecastData.method.replace('_', ' ')}</Badge>
          </div>
        )}
      </div>

      {/* ─── Two-column: Demand + Planner ─── */}
      <div className="wfp-two-col">

        {/* Skill Demand vs Supply */}
        <div className="wfp-section">
          <div className="wfp-section-header" style={{ marginBottom: 12 }}>
            <div className="wfp-section-title">
              <div className="wfp-section-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
                <Zap size={18} />
              </div>
              <div>
                <h3>Skill Demand vs Supply</h3>
                <span className="muted" style={{ fontSize: 12.5 }}>Published jobs vs talent pool</span>
              </div>
            </div>
          </div>

          {(!demandData || !demandData.has_data) ? (
            <p className="muted" style={{ padding: 24, textAlign: 'center' }}>No skill data available yet.</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto', marginLeft: -8, marginRight: -8 }}>
                <div style={{ minWidth: 320 }}>
                  <ResponsiveContainer width="100%" height={Math.max(240, (demandData.items?.length || 0) * 34)}>
                    <BarChart data={demandData.items} layout="vertical"
                      margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                      <YAxis type="category" dataKey="skill" width={80}
                        tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar dataKey="demand" name="Demand" fill="#ec4899" radius={[0, 6, 6, 0]} barSize={12} />
                      <Bar dataKey="supply" name="Supply" fill="#10b981" radius={[0, 6, 6, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Skill gap table */}
              <div className="wfp-skill-table-wrap">
                <table className="data wfp-skill-table">
                  <thead>
                    <tr><th>Skill</th><th style={{ textAlign: 'center' }}>Demand</th><th style={{ textAlign: 'center' }}>Supply</th><th style={{ textAlign: 'right' }}>Gap</th></tr>
                  </thead>
                  <tbody>
                    {(demandData.items || []).map(s => {
                      const isShortage = s.gap > 0
                      const isSurplus = s.gap < 0
                      return (
                        <tr key={s.skill}>
                          <td><strong style={{ fontSize: 13 }}>{s.skill}</strong></td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="wfp-pill wfp-pill-pink">{s.demand}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="wfp-pill wfp-pill-green">{s.supply}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              fontWeight: 700, fontSize: 13,
                              color: isShortage ? '#e11d48' : isSurplus ? '#059669' : 'var(--text-3)',
                              background: isShortage ? '#fff1f2' : isSurplus ? '#ecfdf5' : 'transparent',
                              padding: '3px 10px', borderRadius: 6,
                            }}>
                              {isShortage ? `↑ ${s.gap}` : isSurplus ? `↓ ${Math.abs(s.gap)}` : '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Funnel Planner */}
        <div className="wfp-section">
          <div className="wfp-section-header" style={{ marginBottom: 12 }}>
            <div className="wfp-section-title">
              <div className="wfp-section-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Target size={18} />
              </div>
              <div>
                <h3>Requirement Planner</h3>
                <span className="muted" style={{ fontSize: 12.5 }}>Reverse-funnel calculator</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '16px 20px', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Hires</div>
            <div className="flex" style={{ gap: 12 }}>
              <input type="number" className="input" style={{ width: 100, background: 'var(--surface)' }}
                value={targetHires} onChange={e => setTargetHires(Math.max(1, Number(e.target.value)))} />
              <button className="btn-primary" onClick={loadPlan} disabled={planLoading}>
                {planLoading ? 'Calculating…' : 'Calculate'}
              </button>
            </div>
          </div>

          {planData && (
            <>
              <div className="wfp-planner-grid">
                {FUNNEL_STEPS.map(s => {
                  const val = planData.needed?.[s.key] ?? 0
                  return (
                    <div key={s.key} className="wfp-planner-card">
                      <div style={{ display: 'flex', justifyContent: 'center', color: s.color, marginBottom: 6 }}><s.icon size={16} /></div>
                      <div className="wfp-pcard-val">~{val}</div>
                      <div className="wfp-pcard-lbl">{s.label}</div>
                    </div>
                  )
                })}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Conversion Rates Used</div>
                <div className="stack" style={{ gap: 10 }}>
                  {[
                    { label: 'Applied → Shortlist', val: planData.rates_used?.app_to_shortlist / 100 },
                    { label: 'Shortlist → Interview', val: planData.rates_used?.shortlist_to_interview / 100 },
                    { label: 'Interview → Offer', val: planData.rates_used?.interview_to_offer / 100 },
                    { label: 'Offer → Join', val: planData.rates_used?.offer_to_join / 100 },
                  ].map((r, i) => (
                    <div key={i} className="flex" style={{ gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, width: 180, fontWeight: 500, color: 'var(--text-2)' }}>{r.label}</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(r.val * 100, 100)}%`, height: '100%', background: 'var(--brand-500)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}


/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
      fontSize: 12.5,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>{label}</div>
      {payload.map(p => p.value != null && (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}


/* ─── Helpers ─── */
function buildChartData(forecastData) {
  if (!forecastData) return []
  const map = new Map()
  for (const pt of (forecastData.history || [])) {
    map.set(pt.month, { month: pt.month, history: pt.count, forecast: null })
  }
  const historyArr = forecastData.history || []
  const forecastArr = forecastData.forecast || []
  if (historyArr.length > 0 && forecastArr.length > 0) {
    const lastHist = historyArr[historyArr.length - 1]
    const entry = map.get(lastHist.month)
    if (entry) entry.forecast = lastHist.count
  }
  for (const pt of forecastArr) {
    if (map.has(pt.month)) {
      map.get(pt.month).forecast = pt.value
    } else {
      map.set(pt.month, { month: pt.month, history: null, forecast: pt.value })
    }
  }
  return Array.from(map.values())
}

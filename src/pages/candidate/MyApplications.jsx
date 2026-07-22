import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, Briefcase, CheckCircle2, Clock, XCircle, Search, 
  ExternalLink, Sparkles, Building2, Calendar, Award, ChevronDown, 
  ChevronUp, Video, Layers, Check, ArrowRight
} from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, Badge, StatCard } from '../../components/UI'
import { fmtDate } from '../../utils/helpers'

const DEFAULT_STAGES = [
  'Applied',
  'Eligibility Checked',
  'Resume Screened',
  'Shortlisted',
  'Assessment',
  'Interview Round 1',
  'Interview Round 2',
  'HR Round',
  'Offered',
  'Joined'
]

export default function MyApplications() {
  const { data, loading, error, refetch } = useFetch('/my-applications')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL') // ALL, ACTIVE, OFFERED, REJECTED
  const [expandedApp, setExpandedApp] = useState({}) // toggles history breakdown per application ID

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const items = data?.items || []
  const pipelineStages = data?.pipeline_stages || DEFAULT_STAGES
  
  const totalCount = items.length
  const activeCount = items.filter(a => a.status === 'Active').length
  const rejectedCount = items.filter(a => a.status === 'Rejected').length
  const offeredCount = items.filter(a => a.stage === 'Offered' || a.stage === 'Joined').length

  const toggleExpand = (aid) => {
    setExpandedApp(prev => ({ ...prev, [aid]: !prev[aid] }))
  }

  const filteredItems = items.filter(a => {
    const matchesSearch = !search ||
      (a.job_title && a.job_title.toLowerCase().includes(search.toLowerCase())) ||
      (a.company && a.company.toLowerCase().includes(search.toLowerCase())) ||
      (a.stage && a.stage.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (filter === 'ACTIVE') return a.status === 'Active' && a.stage !== 'Offered' && a.stage !== 'Joined'
    if (filter === 'OFFERED') return a.stage === 'Offered' || a.stage === 'Joined'
    if (filter === 'REJECTED') return a.status === 'Rejected'
    return true
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <div className="flex" style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
              <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} /> CANDIDATE PIPELINE TRACKER
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>My Application Journey & Stage Paths</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
            Detailed stage-by-stage insights, evaluation progress, and scheduled interview status.
          </p>
        </div>

        <Link to="/careers" className="btn-primary flex" style={{ gap: 8, background: '#c5307b', borderColor: '#c5307b', textDecoration: 'none', padding: '10px 20px', borderRadius: 10 }}>
          <Briefcase size={16} /> Explore Open Roles
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={FileText} label="Total Applications" value={totalCount} tone="brand" />
        <StatCard icon={Clock} label="In Active Pipeline" value={activeCount} tone="blue" />
        <StatCard icon={CheckCircle2} label="Offered / Joined" value={offeredCount} tone="green" />
        <StatCard icon={XCircle} label="Rejected / Decision Made" value={rejectedCount} tone="red" />
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div className="flex wrap" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
          <div className="flex wrap" style={{ gap: 8 }}>
            <button className={`btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('ALL')}>
              All ({totalCount})
            </button>
            <button className={`btn-sm ${filter === 'ACTIVE' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('ACTIVE')}>
              Active ({activeCount})
            </button>
            <button className={`btn-sm ${filter === 'OFFERED' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('OFFERED')}>
              Offered ({offeredCount})
            </button>
            <button className={`btn-sm ${filter === 'REJECTED' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('REJECTED')}>
              Rejected ({rejectedCount})
            </button>
          </div>

          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              className="input" 
              style={{ paddingLeft: 36, height: 38, width: '100%' }} 
              placeholder="Search by job title or company..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      {filteredItems.length === 0 ? (
        <EmptyState 
          icon={Briefcase} 
          title="No applications found" 
          message={search || filter !== 'ALL' ? "No applications match your selected filter." : "You haven't submitted any job applications yet."} 
          action={<Link className="btn-primary" style={{ textDecoration: 'none' }} to="/careers">Browse Open Jobs</Link>} 
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredItems.map((a) => {
            const isRejected = a.status === 'Rejected'
            const isOffered = a.stage === 'Offered' || a.stage === 'Joined'
            const currentStageIdx = pipelineStages.indexOf(a.stage)
            const isExpanded = !!expandedApp[a.id]
            const historyList = a.history || []
            const interviewsList = a.interviews || []

            return (
              <div 
                key={a.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 16,
                  borderTop: isOffered ? '4px solid #10b981' : isRejected ? '4px solid #ef4444' : '4px solid #3b82f6',
                  padding: '24px'
                }}
              >
                {/* Header Information */}
                <div className="flex wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{a.job_title}</h2>
                    <div className="flex wrap" style={{ gap: 16, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                      {a.company && (
                        <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
                          <Building2 size={15} /> {a.company}
                        </div>
                      )}
                      <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
                        <Calendar size={15} /> Applied: {fmtDate(a.applied_at)}
                      </div>
                      {a.match_score != null && (
                        <div className="flex" style={{ gap: 6, alignItems: 'center', color: '#c5307b', fontWeight: 700 }}>
                          <Award size={15} /> {a.match_score}% Match Score
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge variant={isRejected ? 'badge-red' : isOffered ? 'badge-green' : 'badge-blue'}>
                    Status: {a.status} ({a.stage})
                  </Badge>
                </div>

                {/* Stage-to-Stage Pipeline Path Visualization */}
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div className="flex mb-3" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                      <Layers size={16} color="#3b82f6" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Selection Pipeline Path</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isRejected ? '#ef4444' : '#2563eb' }}>
                      Stage {currentStageIdx >= 0 ? currentStageIdx + 1 : 1} of {pipelineStages.length}: <strong>{a.stage}</strong>
                    </span>
                  </div>

                  {/* Horizontal Scrollable Pipeline Stepper */}
                  <div style={{ overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
                    <div className="flex" style={{ minWidth: 700, alignItems: 'center', position: 'relative' }}>
                      {pipelineStages.map((stg, idx) => {
                        const isPast = currentStageIdx > idx
                        const isCurrent = currentStageIdx === idx
                        const isFuture = currentStageIdx < idx || currentStageIdx === -1

                        return (
                          <div key={stg} className="flex" style={{ flex: 1, alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 75, textAlign: 'center' }}>
                              
                              {/* Circle Step Icon */}
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 800,
                                background: isPast ? '#10b981' : isCurrent ? (isRejected ? '#ef4444' : '#2563eb') : '#e2e8f0',
                                color: isPast || isCurrent ? '#ffffff' : '#64748b',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none',
                                transition: 'all 0.2s'
                              }}>
                                {isPast ? <Check size={14} /> : (idx + 1)}
                              </div>

                              {/* Label */}
                              <span style={{
                                fontSize: 11,
                                fontWeight: isCurrent ? 800 : isPast ? 700 : 500,
                                color: isCurrent ? (isRejected ? '#ef4444' : '#1e293b') : isPast ? '#10b981' : '#94a3b8',
                                lineHeight: 1.2
                              }}>
                                {stg}
                              </span>
                            </div>

                            {/* Connecting Line */}
                            {idx < pipelineStages.length - 1 && (
                              <div style={{
                                flex: 1,
                                height: 3,
                                background: isPast ? '#10b981' : '#e2e8f0',
                                margin: '0 4px',
                                marginTop: -18
                              }} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Scheduled Interviews Block (If Any) */}
                {interviewsList.length > 0 && (
                  <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10, border: '1px solid #bfdbfe' }}>
                    <div className="flex mb-2" style={{ gap: 8, alignItems: 'center' }}>
                      <Video size={16} color="#2563eb" />
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', margin: 0 }}>Assigned Interview Session</h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                      {interviewsList.map(iv => (
                        <div key={iv.id} style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #dbeafe' }}>
                          <div className="flex" style={{ justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                            <span>{iv.round_name}</span>
                            <Badge variant={iv.result === 'Pass' ? 'badge-green' : iv.result === 'Fail' ? 'badge-red' : 'badge-amber'}>
                              {iv.result || 'Scheduled'}
                            </Badge>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                            {iv.scheduled_at ? fmtDate(iv.scheduled_at) : 'TBD'} • {iv.mode}
                          </div>
                          {iv.location && (
                            <a href={iv.location} target="_blank" rel="noreferrer" className="link mt-2" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
                              <Video size={13} /> Join Meeting Call <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Action & History Toggle Bar */}
                <div className="flex wrap" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <button 
                    className="btn-ghost btn-sm flex" 
                    style={{ gap: 6, fontWeight: 700, color: '#334155' }}
                    onClick={() => toggleExpand(a.id)}
                  >
                    <Clock size={15} /> 
                    {isExpanded ? 'Hide Stage History' : `View Stage History (${historyList.length})`}
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  <Link 
                    to={`/careers/${a.job_id}`} 
                    className="btn-soft btn-sm flex" 
                    style={{ gap: 6, textDecoration: 'none', fontWeight: 700 }}
                  >
                    View Job Description <ExternalLink size={13} />
                  </Link>
                </div>

                {/* Expandable History Log */}
                {isExpanded && (
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 4 }} className="stack">
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                      Stage Transition History Log
                    </div>

                    {historyList.length === 0 ? (
                      <p className="muted" style={{ fontSize: 13, margin: 0 }}>No previous stage transitions recorded yet.</p>
                    ) : (
                      <div className="stack" style={{ gap: 10 }}>
                        {historyList.map((h, hIdx) => (
                          <div key={h.id || hIdx} className="flex" style={{ gap: 12, alignItems: 'flex-start', fontSize: 12.5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div className="flex wrap" style={{ gap: 6, alignItems: 'center' }}>
                                <strong style={{ color: '#0f172a' }}>
                                  {h.from_stage ? `${h.from_stage} ➔ ${h.to_stage}` : h.to_stage}
                                </strong>
                                <span className="muted">• {fmtDate(h.created_at)}</span>
                              </div>
                              {h.note && (
                                <div style={{ color: '#475569', fontSize: 12, marginTop: 2, background: '#ffffff', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', display: 'inline-block' }}>
                                  {h.note}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

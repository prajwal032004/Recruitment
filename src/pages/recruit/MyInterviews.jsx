import { useState } from 'react'
import { 
  ClipboardList, Calendar, Video, FileText, CheckCircle2, XCircle, 
  Clock, Search, UserCheck, Briefcase, ExternalLink, Sparkles, Undo2 
} from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, Badge, Modal, StatCard } from '../../components/UI'
import { apiPost, baseURL } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { fmtDate } from '../../utils/helpers'

const SCORES = ['technical', 'problem_solving', 'communication', 'role_knowledge', 'experience', 'overall_rating']
const LABELS = { 
  technical: 'Technical Skills', 
  problem_solving: 'Problem Solving', 
  communication: 'Communication', 
  role_knowledge: 'Role Knowledge', 
  experience: 'Domain Experience', 
  overall_rating: 'Overall Impression' 
}

export default function MyInterviews() {
  const { data, loading, error, refetch } = useFetch('/my-interviews')
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [fb, setFb] = useState({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL') // ALL, PENDING, COMPLETED

  const openFb = (iv) => {
    setFb(iv.my_feedback || { recommendation: 'Hire' })
    setModal(iv)
  }

  const submitVerdict = async (verdict) => {
    try { 
      await apiPost(`/interviews/${modal.id}/verdict`, { ...fb, verdict })
      toast.success(verdict === 'Pass' ? 'Verdict recorded: Candidate Passed' : 'Verdict recorded: Candidate Failed')
      setModal(null)
      refetch() 
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const items = data || []
  
  const totalCount = items.length
  const pendingCount = items.filter(i => !i.my_feedback?.verdict).length
  const passCount = items.filter(i => i.my_feedback?.verdict === 'Pass').length
  const failCount = items.filter(i => i.my_feedback?.verdict === 'Fail').length

  const filteredItems = items.filter(iv => {
    const matchesSearch = !search || 
      (iv.candidate_name && iv.candidate_name.toLowerCase().includes(search.toLowerCase())) ||
      (iv.job_title && iv.job_title.toLowerCase().includes(search.toLowerCase())) ||
      (iv.round_name && iv.round_name.toLowerCase().includes(search.toLowerCase()))
    
    if (!matchesSearch) return false

    if (filter === 'PENDING') return !iv.my_feedback?.verdict
    if (filter === 'COMPLETED') return !!iv.my_feedback?.verdict
    return true
  })

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Welcome Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <div className="flex" style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
              <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} /> INTERVIEWER PORTAL
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, margin: '0 0 8px 0', color: '#fff', lineHeight: 1.2 }}>Assigned Candidate Evaluations</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#c7d2fe', lineHeight: 1.5 }}>
            Review candidate details, access uploaded resumes, join live video interviews, and record Pass/Fail verdicts.
          </p>
        </div>

        <div className="flex wrap" style={{ gap: 12, flex: '0 1 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{pendingCount}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase' }}>Pending</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{passCount}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase' }}>Passed</div>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={ClipboardList} label="Total Assigned" value={totalCount} tone="brand" />
        <StatCard icon={Clock} label="Pending Evaluation" value={pendingCount} tone="amber" />
        <StatCard icon={CheckCircle2} label="Recommended Pass" value={passCount} tone="green" />
        <StatCard icon={XCircle} label="Recommended Fail" value={failCount} tone="red" />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div className="flex wrap" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
          <div className="flex wrap" style={{ gap: 8 }}>
            <button 
              className={`btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setFilter('ALL')}
            >
              All ({totalCount})
            </button>
            <button 
              className={`btn-sm ${filter === 'PENDING' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setFilter('PENDING')}
            >
              Pending ({pendingCount})
            </button>
            <button 
              className={`btn-sm ${filter === 'COMPLETED' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setFilter('COMPLETED')}
            >
              Completed ({totalCount - pendingCount})
            </button>
          </div>

          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              className="input" 
              style={{ paddingLeft: 36, height: 38, width: '100%' }} 
              placeholder="Search candidate or role..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Candidates List / Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState 
          icon={UserCheck} 
          title="No interviews found" 
          message={search || filter !== 'ALL' ? "No assigned interviews match your selected filter." : "You currently have no interview evaluations assigned to you."} 
        />
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {filteredItems.map((iv) => {
            const isCompleted = !!iv.my_feedback?.verdict
            const verdict = iv.my_feedback?.verdict

            return (
              <div 
                key={iv.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  borderTop: isCompleted ? (verdict === 'Pass' ? '4px solid #10b981' : '4px solid #ef4444') : '4px solid #f59e0b', 
                  transition: 'all 0.2s',
                  padding: '20px'
                }}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{iv.candidate_name}</h3>
                      <div className="flex mt-1" style={{ gap: 6, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                        <Briefcase size={14} /> {iv.job_title || 'General Role'}
                      </div>
                    </div>

                    <Badge variant={isCompleted ? (verdict === 'Pass' ? 'badge-green' : 'badge-red') : 'badge-amber'}>
                      {isCompleted ? `Verdict: ${verdict}` : 'Pending Verdict'}
                    </Badge>
                  </div>

                  {/* Details Block */}
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }} className="stack">
                    <div className="flex" style={{ gap: 8, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                      <ClipboardList size={16} color="#6366f1" /> 
                      <span>{iv.round_name}</span>
                      <span className="muted">• {iv.mode}</span>
                    </div>

                    <div className="flex" style={{ gap: 8, fontSize: 13, color: '#475569', fontWeight: 500, marginTop: 4 }}>
                      <Calendar size={16} color="#64748b" />
                      <span>{iv.scheduled_at ? fmtDate(iv.scheduled_at) : 'Schedule TBD'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <div className="flex wrap" style={{ gap: 8 }}>
                    {iv.location ? (
                      <a 
                        className="btn-soft btn-sm flex" 
                        style={{ flex: '1 1 130px', justifyContent: 'center', gap: 6, background: '#eff6ff', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }} 
                        href={iv.location} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        <Video size={15} /> Join Call <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="btn-soft btn-sm flex muted" style={{ flex: '1 1 130px', justifyContent: 'center', opacity: 0.6 }}>
                        No Meeting Link
                      </span>
                    )}

                    {iv.resume_file ? (
                      <a 
                        className="btn-soft btn-sm flex" 
                        style={{ flex: '1 1 130px', justifyContent: 'center', gap: 6, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, textDecoration: 'none' }} 
                        href={`${baseURL}/files/${iv.resume_file}?token=${localStorage.getItem('hr_token')}`} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        <FileText size={15} /> View Resume
                      </a>
                    ) : null}
                  </div>

                  <button 
                    className={`btn-sm btn-block flex ${isCompleted ? 'btn-ghost' : 'btn-primary'}`} 
                    style={{ justifyContent: 'center', gap: 8, height: 38, fontWeight: 700 }}
                    onClick={() => openFb(iv)}
                  >
                    <ClipboardList size={16} /> 
                    {isCompleted ? 'Review / Edit Feedback' : 'Evaluate & Submit Verdict'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detailed Feedback & Verdict Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={`Evaluation — ${modal?.candidate_name || ''}`} width={620}
        footer={fb.verdict ? (
          <div className="flex" style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 13 }}>Verdict recorded and stored in pipeline.</span>
            <button className="btn-ghost" onClick={() => setModal(null)}>Close</button>
          </div>
        ) : (
          <div className="flex wrap" style={{ width: '100%', justifyContent: 'space-between', gap: 12 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <div className="flex wrap" style={{ gap: 10 }}>
              <button className="btn-danger" style={{ padding: '8px 20px', fontWeight: 800 }} onClick={() => submitVerdict('Fail')}>
                🔴 FAIL CANDIDATE
              </button>
              <button className="btn-primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '8px 20px', fontWeight: 800 }} onClick={() => submitVerdict('Pass')}>
                🟢 PASS CANDIDATE
              </button>
            </div>
          </div>
        )}>
        
        {/* Banner if Verdict Recorded */}
        {fb.verdict && (
          <div className="mb-4" style={{ 
            padding: '12px 16px', 
            background: fb.verdict === 'Fail' ? '#fef2f2' : '#f0fdf4', 
            borderRadius: 8, 
            border: fb.verdict === 'Fail' ? '1px solid #fecaca' : '1px solid #bbf7d0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Submitted Decision:</span>
              <Badge variant={fb.verdict === 'Pass' ? 'badge-green' : 'badge-red'}>{fb.verdict.toUpperCase()}</Badge>
            </div>
            {fb.verdict === 'Fail' && (
              <button
                className="btn-soft btn-sm flex"
                style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, gap: 4 }}
                onClick={async () => {
                  try {
                    await apiPost(`/applications/${modal.application_id}/undo-reject`)
                    toast.success('Rejection undone! Candidate returned to evaluation.')
                    setModal(null)
                    refetch()
                  } catch (err) {
                    toast.error(err.message || 'Failed to undo rejection')
                  }
                }}
              >
                <Undo2 size={14} /> Undo Reject
              </button>
            )}
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 10 }}>
          Structured Scorecard (1 to 10 Ratings)
        </div>

        <div className="grid-stats mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {SCORES.map((s) => (
            <div className="field" key={s} style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>{LABELS[s]} (1-10)</label>
              <input 
                className="input" 
                type="number" 
                min="1" 
                max="10" 
                placeholder="1-10" 
                value={fb[s] ?? ''} 
                onChange={(e) => setFb({ ...fb, [s]: e.target.value })} 
                disabled={!!fb.verdict}
              />
            </div>
          ))}
        </div>

        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Key Candidate Strengths</label>
          <textarea 
            className="input" 
            rows={2} 
            placeholder="Highlight technical proficiency, communication clarity, problem-solving approach..." 
            value={fb.strengths || ''} 
            onChange={(e) => setFb({ ...fb, strengths: e.target.value })} 
            disabled={!!fb.verdict}
          />
        </div>

        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Key Concerns or Skill Gaps</label>
          <textarea 
            className="input" 
            rows={2} 
            placeholder="Note any gaps in expected experience, theoretical fundamentals..." 
            value={fb.concerns || ''} 
            onChange={(e) => setFb({ ...fb, concerns: e.target.value })} 
            disabled={!!fb.verdict}
          />
        </div>

        <div className="field">
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Overall Recommendation</label>
          <select 
            className="select" 
            value={fb.recommendation || 'Hire'} 
            onChange={(e) => setFb({ ...fb, recommendation: e.target.value })} 
            disabled={!!fb.verdict}
          >
            <option value="Strong Hire">Strong Hire</option>
            <option value="Hire">Hire</option>
            <option value="No Hire">No Hire</option>
            <option value="Strong No Hire">Strong No Hire</option>
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Detailed Feedback & Notes</label>
          <textarea 
            className="input" 
            rows={3} 
            placeholder="Additional context or qualitative feedback for HR..." 
            value={fb.comments || ''} 
            onChange={(e) => setFb({ ...fb, comments: e.target.value })} 
            disabled={!!fb.verdict} 
          />
        </div>
      </Modal>
    </div>
  )
}

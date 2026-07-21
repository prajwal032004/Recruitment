import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge, Modal } from '../../components/UI'
import { apiPost, baseURL } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { fmtDate } from '../../utils/helpers'

const SCORES = ['technical', 'problem_solving', 'communication', 'role_knowledge', 'experience', 'overall_rating']
const LABELS = { technical: 'Technical', problem_solving: 'Problem solving', communication: 'Communication', role_knowledge: 'Role knowledge', experience: 'Experience', overall_rating: 'Overall' }

export default function MyInterviews() {
  const { data, loading, error, refetch } = useFetch('/my-interviews')
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [fb, setFb] = useState({})

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

  return (
    <div>
      <PageHeader title="My Interviews" subtitle="Interviews assigned to you. Submit structured feedback." icon={ClipboardList} />
      {items.length === 0 ? <EmptyState icon={ClipboardList} title="No interviews assigned to you" /> : (
        <div className="grid-cards">
          {items.map((iv) => (
            <div key={iv.id} className="card">
              <div className="row-between"><strong>{iv.candidate_name}</strong>
                <Badge variant={iv.my_feedback ? 'badge-green' : 'badge-amber'}>{iv.my_feedback ? 'Submitted' : 'Pending'}</Badge></div>
              <div className="muted mt-2">{iv.job_title}</div>
              <div className="muted">{iv.round_name} · {iv.mode}</div>
              <div className="muted mt-2">{iv.scheduled_at ? fmtDate(iv.scheduled_at) : 'TBD'}</div>
              {iv.location && <a className="link mt-2" href={iv.location} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 13 }}>Meeting link</a>}
              {iv.resume_file && <a className="link mt-1" href={`${baseURL}/files/${iv.resume_file}?token=${localStorage.getItem('hr_token')}`} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 13 }}>View Resume</a>}
              <button className="btn-primary btn-sm btn-block mt-4" onClick={() => openFb(iv)}>{iv.my_feedback?.verdict ? 'View feedback' : iv.my_feedback ? 'Edit feedback' : 'Submit feedback'}</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title="Interview Feedback & Verdict" width={560}
        footer={fb.verdict ? (
          <><button className="btn-ghost" onClick={() => setModal(null)}>Close</button></>
        ) : (
          <><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => submitVerdict('Fail')}>FAIL</button>
          <button className="btn-primary" onClick={() => submitVerdict('Pass')} style={{ background: 'var(--green-600)' }}>PASS</button></>
        )}>
        {fb.verdict && (
          <div className="mb-4" style={{ padding: '12px 14px', background: fb.verdict === 'Fail' ? '#fef2f2' : '#f0fdf4', borderRadius: 8, border: fb.verdict === 'Fail' ? '1px solid #fecaca' : '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Recorded Verdict:</span>
              <Badge variant={fb.verdict === 'Pass' ? 'badge-green' : 'badge-red'}>{fb.verdict}</Badge>
            </div>
            {fb.verdict === 'Fail' && (
              <button
                className="btn-soft btn-sm"
                style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700 }}
                onClick={async () => {
                  try {
                    await apiPost(`/applications/${modal.application_id}/undo-reject`)
                    toast.success('Rejection undone! You can re-evaluate the candidate.')
                    setModal(null)
                    refetch()
                  } catch (err) {
                    toast.error(err.message || 'Failed to undo rejection')
                  }
                }}
              >
                Undo Reject & Re-evaluate
              </button>
            )}
          </div>
        )}
        <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          {SCORES.map((s) => (
            <div className="field" key={s}><label>{LABELS[s]} (1-10)</label>
              <input className="input" type="number" min="1" max="10" value={fb[s] ?? ''} onChange={(e) => setFb({ ...fb, [s]: e.target.value })} /></div>
          ))}
        </div>
        <div className="field"><label>Strengths</label><textarea className="input" rows={2} value={fb.strengths || ''} onChange={(e) => setFb({ ...fb, strengths: e.target.value })} /></div>
        <div className="field"><label>Concerns</label><textarea className="input" rows={2} value={fb.concerns || ''} onChange={(e) => setFb({ ...fb, concerns: e.target.value })} /></div>
        <div className="field"><label>Recommendation</label>
          <select className="select" value={fb.recommendation || 'Hire'} onChange={(e) => setFb({ ...fb, recommendation: e.target.value })} disabled={!!fb.verdict}>
            <option>Strong Hire</option><option>Hire</option><option>No Hire</option><option>Strong No Hire</option></select></div>
        <div className="field"><label>Comments</label><textarea className="input" rows={3} value={fb.comments || ''} onChange={(e) => setFb({ ...fb, comments: e.target.value })} disabled={!!fb.verdict} /></div>
      </Modal>
    </div>
  )
}

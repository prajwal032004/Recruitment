import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle, CalendarPlus, Star, RotateCcw } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, PageHeader, Badge, Avatar, Modal, ProgressBar } from '../../components/UI'
import { apiGet, apiPut, apiPost, baseURL } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { fmtDate } from '../../utils/helpers'

const STAGES = ['Applied', 'Eligibility Checked', 'Resume Screened', 'Shortlisted', 'Assessment',
  'Interview Round 1', 'Interview Round 2', 'HR Round', 'Offered', 'Joined']

export default function ApplicationDetail() {
  const { aid } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data, loading, error, refetch } = useFetch(`/applications/${aid}`)
  const { data: interviewers_data } = useFetch('/interviewers')
  const [notes, setNotes] = useState('')
  const [ivModal, setIvModal] = useState(false)
  const [iv, setIv] = useState({ round_name: 'Tech 1', pipeline_stage: 'Technical Interview', interviewer_ids: [], scheduled_at: '', mode: 'Video', location: '' })
  const [joinedMoveConfirm, setJoinedMoveConfirm] = useState(null)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const a = data.application || data
  const c = data.candidate || a.candidate || {}
  const history = data.history || a.history || []
  const interviews = data.interviews || a.interviews || []
  const match = typeof a.match_detail === 'object' && a.match_detail !== null ? a.match_detail : {}
  const reasons = Array.isArray(a.eligibility_reasons) ? a.eligibility_reasons : []
  const interviewerList = Array.isArray(interviewers_data) ? interviewers_data : (interviewers_data?.items || [])

  const setStage = async (stage) => {
    try { await apiPut(`/applications/${aid}/stage`, { stage }); toast.success('Stage updated'); refetch() }
    catch (e) { toast.error(e.message) }
  }
  const setStatus = async (status) => {
    try { await apiPut(`/applications/${aid}/stage`, { status }); toast.success('Status updated'); refetch() }
    catch (e) { toast.error(e.message) }
  }
  const saveNotes = async () => {
    try { await apiPut(`/applications/${aid}/notes`, { hr_notes: notes || a.hr_notes }); toast.success('Notes saved'); refetch() }
    catch (e) { toast.error(e.message) }
  }
  const override = async (st) => {
    try { await apiPut(`/applications/${aid}/override`, { eligibility_status: st }); toast.success('Eligibility overridden'); refetch() }
    catch (e) { toast.error(e.message) }
  }
  const scheduleIv = async () => {
    try {
      await apiPost('/interviews', { ...iv, application_id: Number(aid) })
      toast.success('Interview scheduled'); setIvModal(false); refetch()
    } catch (e) { toast.error(e.message) }
  }

  const resumeFile = a.resume_file || c.resume_file

  return (
    <div>
      <button className="btn-ghost btn-sm mb-4" onClick={() => nav('/app/applications')}><ArrowLeft size={15} /> Applications List</button>
      <PageHeader title={c.name || 'Candidate'} subtitle={`Applied for ${a.job_title || 'General Application'} · via ${a.source || 'DIRECT'}`}
        actions={
          <div className="flex" style={{ gap: 12 }}>
            <button className="btn-primary" onClick={() => setIvModal(true)}><CalendarPlus size={16} style={{ marginRight: 6 }} /> Schedule Interview</button>
            {(a.status === 'Rejected' || a.stage === 'Rejected') ? (
              <button 
                className="btn-soft" 
                style={{ 
                  background: (a.undo_count || 0) >= 5 ? 'var(--surface-3)' : '#fef2f2', 
                  color: (a.undo_count || 0) >= 5 ? 'var(--text-3)' : '#dc2626', 
                  border: (a.undo_count || 0) >= 5 ? '1px solid var(--border)' : '1px solid #fecaca',
                  fontWeight: 700,
                  cursor: (a.undo_count || 0) >= 5 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                disabled={(a.undo_count || 0) >= 5}
                onClick={async () => {
                  if ((a.undo_count || 0) >= 5) return toast.error('Maximum undo limit (5/5) reached. Candidate must reapply.')
                  try {
                    const res = await apiPost(`/applications/${a.id}/undo-reject`)
                    toast.success(`Candidate restored to ${res.stage} stage! (${res.remaining_undos} undos left)`)
                    refetch()
                  } catch (err) { toast.error(err.message || 'Failed to undo rejection') }
                }}
              >
                <RotateCcw size={15} />
                {(a.undo_count || 0) >= 5 ? 'Max Undos Reached (Must Reapply)' : `Undo Reject (${a.undo_count || 0}/5)`}
              </button>
            ) : (
              <button className="btn-danger" onClick={() => setStatus('Rejected')}>Reject Candidate</button>
            )}
          </div>} />

      <div className="two-col">
        <div>
          {/* Stage control */}
          <div className="card card-pad mb-4" style={{ borderTop: '4px solid var(--brand-500)', boxShadow: 'var(--shadow-md)' }}>
            <div className="row-between mb-6">
              <h3 className="h2" style={{ fontSize: 18, fontWeight: 700 }}>Pipeline Stage</h3>
              <Badge variant={a.status === 'Rejected' ? 'badge-red' : a.status === 'On Hold' ? 'badge-amber' : 'badge-green'} style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700, borderRadius: 20 }}>{a.status}</Badge>
            </div>
            {(a.status === 'Rejected' || a.stage === 'Rejected') && (
              <div className="mb-4" style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>This candidate application is Rejected.</div>
                  <div className="muted" style={{ fontSize: 12.5, color: '#b91c1c' }}>
                    Undo allowed up to 5 times. Used: {a.undo_count || 0}/5 times. {(a.undo_count || 0) >= 5 ? 'Candidate must reapply.' : ''}
                  </div>
                </div>
                <button 
                  className="btn-soft btn-sm"
                  style={{ background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  disabled={(a.undo_count || 0) >= 5}
                  onClick={async () => {
                    if ((a.undo_count || 0) >= 5) return toast.error('Maximum undo limit (5/5) reached. Candidate must reapply.')
                    try {
                      const res = await apiPost(`/applications/${a.id}/undo-reject`)
                      toast.success(`Candidate restored to ${res.stage} stage! (${res.remaining_undos} undos left)`)
                      refetch()
                    } catch (err) { toast.error(err.message || 'Failed to undo rejection') }
                  }}
                >
                  <RotateCcw size={14} />
                  {(a.undo_count || 0) >= 5 ? 'Max Undos Reached' : `Undo Reject (${a.undo_count || 0}/5)`}
                </button>
              </div>
            )}
            <div className="flex wrap" style={{ gap: 10 }}>
              {STAGES.map((s) => {
                const currentIndex = STAGES.indexOf(a.stage);
                const targetIndex = STAGES.indexOf(s);
                const isValid = targetIndex <= currentIndex + 1;
                const isActive = a.stage === s;

                return (
                  <button 
                    key={s} 
                    className={isActive ? 'btn-primary' : 'btn-soft'} 
                    style={{ 
                      padding: '8px 18px', 
                      borderRadius: 24, 
                      fontSize: 13, 
                      fontWeight: 600, 
                      border: isActive ? 'none' : '1px solid var(--border)', 
                      transition: 'all 0.2s ease', 
                      opacity: isActive ? 1 : isValid ? 0.75 : 0.3, 
                      cursor: isValid ? 'pointer' : 'not-allowed',
                      boxShadow: isActive ? '0 4px 12px rgba(197, 48, 123, 0.2)' : 'none' 
                    }} 
                    disabled={!isValid}
                    onClick={() => {
                      if (a.stage === 'Joined' && s !== 'Joined') {
                        setJoinedMoveConfirm(s)
                      } else {
                        setStage(s)
                      }
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="divider" style={{ margin: '24px 0', opacity: 0.5 }} />
            <div className="flex" style={{ gap: 12 }}>
              <button className="btn-ghost" onClick={() => setStatus('On Hold')} style={{ fontWeight: 600 }}>Put On Hold</button>
              <button className="btn-ghost" style={{ color: 'var(--green-600)', fontWeight: 600 }} onClick={() => setStatus('Active')}>Reactivate</button>
            </div>
          </div>

          {/* Match breakdown */}
          <div className="card card-pad mb-4" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="row-between mb-6">
              <h3 className="h2" style={{ fontSize: 18, fontWeight: 700 }}>Resume Match</h3>
              <span className="match-pill" style={{ background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', color: 'white', fontWeight: 800, fontSize: 15, padding: '8px 18px', borderRadius: 24, boxShadow: '0 4px 12px rgba(197, 48, 123, 0.3)' }}>{a.match_score ?? 0}% Match</span>
            </div>
            <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${a.match_score ?? 0}%`, background: 'linear-gradient(90deg, var(--brand-400), var(--brand-600))', borderRadius: 10 }} />
            </div>
            <div className="grid-stats mt-6" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <MiniStat label="Req. coverage" value={`${match.required_coverage ?? 0}%`} />
              <MiniStat label="Pref. coverage" value={`${match.preferred_coverage ?? 0}%`} />
              <MiniStat label="Text similarity" value={`${match.text_similarity ?? 0}%`} />
            </div>
            {(match.matched_required || []).length > 0 && <div className="mt-6"><h4 className="mb-3" style={{ fontSize: 14, fontWeight: 600 }}>Matched required skills</h4>
              <div className="flex wrap" style={{ gap: 8 }}>{(match.matched_required || []).map((s) => <span key={s} className="chip" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700, padding: '4px 14px', borderRadius: 20, boxShadow: '0 2px 4px rgba(4,120,87,0.05)' }}>{s}</span>)}</div></div>}
            {(match.missing_required || []).length > 0 && <div className="mt-6"><h4 className="mb-3" style={{ fontSize: 14, fontWeight: 600 }}>Missing required skills</h4>
              <div className="flex wrap" style={{ gap: 8 }}>{(match.missing_required || []).map((s) => <span key={s} className="chip" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 700, padding: '4px 14px', borderRadius: 20, boxShadow: '0 2px 4px rgba(185,28,28,0.05)' }}>{s}</span>)}</div></div>}
          </div>

          {/* Eligibility */}
          <div className="card card-pad mb-4" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="row-between mb-6">
              <h3 className="h2" style={{ fontSize: 18, fontWeight: 700 }}>Preference & Eligibility Screening</h3>
              <Badge variant={
                ['Highly Preferable', 'Preferable', 'Eligible'].includes(a.eligibility_status) ? 'badge-green' :
                ['Considerable', 'Needs Review'].includes(a.eligibility_status) ? 'badge-amber' :
                ['Relevant'].includes(a.eligibility_status) ? 'badge-blue' : 'badge-red'
              } style={{ padding: '6px 14px', fontSize: 13, fontWeight: 700, borderRadius: 20 }}>{a.eligibility_status || '—'}</Badge></div>
            {reasons.length === 0 ? <p className="muted" style={{ fontSize: 14 }}>All configured rules passed.</p> : (
              <div className="stack" style={{ gap: 12, background: 'var(--surface-2)', padding: 16, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                {reasons.map((r, i) => (
                  <div key={i} className="flex" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 2 }}>{r.status === 'fail' ? <XCircle size={18} color="var(--red-500)" /> : r.status === 'override' ? <Star size={18} color="var(--violet-500)" /> : <AlertCircle size={18} color="var(--amber-500)" />}</div>
                    <span style={{ fontSize: 14, lineHeight: 1.5 }}><strong>{r.rule}:</strong> <span className="muted">{r.detail}</span></span>
                  </div>
                ))}
              </div>
            )}
            <div className="divider" style={{ margin: '24px 0', opacity: 0.5 }} />
            <p className="muted mb-4" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>HR manual override:</p>
            <div className="flex wrap" style={{ gap: 10 }}>
              <button className="btn-soft" onClick={() => override('Highly Preferable')} style={{ fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: 'var(--green-50)', color: 'var(--green-700)' }}>Highly Preferable</button>
              <button className="btn-soft" onClick={() => override('Preferable')} style={{ fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: 'var(--blue-50)', color: 'var(--blue-700)' }}>Preferable</button>
              <button className="btn-soft" onClick={() => override('Considerable')} style={{ fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: 'var(--amber-50)', color: 'var(--amber-700)' }}>Considerable</button>
              <button className="btn-soft" onClick={() => override('Not Preferable')} style={{ fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: 'var(--red-50)', color: 'var(--red-700)' }}>Not Preferable</button>
            </div>
          </div>

          {/* Interviews */}
          <div className="card mt-4 card-pad" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h3 className="mb-4 h2" style={{ fontSize: 18, fontWeight: 700 }}>Interviews & Feedback</h3>
            {interviews.length === 0 ? <p className="muted" style={{ fontSize: 14 }}>No interviews scheduled yet.</p> : interviews.map((iv) => (
              <div key={iv.id} className="mb-4" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div className="row-between">
                  <div>
                    <strong style={{ fontSize: 15 }}>{iv.round_name} <span className="muted" style={{ fontWeight: 400 }}>· {iv.mode}</span></strong>
                    {iv.pipeline_stage && <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>(Gates: {iv.pipeline_stage})</span>}
                  </div>
                  <div className="flex" style={{ gap: 8 }}>
                    <Badge variant={iv.result === 'Pass' ? 'badge-green' : iv.result === 'Fail' ? 'badge-red' : 'badge-amber'}>{iv.result}</Badge>
                    <Badge variant={iv.status === 'Completed' ? 'badge-green' : 'badge-blue'} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 16 }}>{iv.status}</Badge>
                  </div>
                </div>
                <div className="muted mt-2" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarPlus size={14} />
                  {iv.scheduled_at ? fmtDate(iv.scheduled_at) : 'TBD'} <span style={{ opacity: 0.5 }}>|</span> Interviewers: {(iv.interviewers || []).map((x) => x.name).join(', ')}
                </div>
                {(iv.feedback || []).map((f) => (
                  <div key={f.id} className="mt-4" style={{ background: 'linear-gradient(180deg, var(--surface-2), #f8f9fa)', borderRadius: 10, padding: 16, border: '1px solid var(--border-light)' }}>
                    <div className="row-between mb-3">
                      <strong style={{ fontSize: 14 }}>{f.interviewer_name}</strong>
                      <div className="flex" style={{ gap: 8 }}>
                        <Badge variant={f.verdict === 'Pass' ? 'badge-green' : f.verdict === 'Fail' ? 'badge-red' : 'badge-yellow'} style={{ borderRadius: 16 }}>{f.verdict || 'Pending'}</Badge>
                        <Badge variant="badge-violet" style={{ borderRadius: 16 }}>{f.recommendation || '—'}</Badge>
                      </div>
                    </div>
                    <div className="flex" style={{ gap: 16, marginBottom: 8 }}>
                      <div style={{ fontSize: 12 }}><strong>Overall:</strong> <span style={{ color: 'var(--brand-600)', fontWeight: 700 }}>{f.overall_rating ?? '—'}/10</span></div>
                      <div style={{ fontSize: 12 }}><strong>Tech:</strong> <span className="muted">{f.technical ?? '—'}</span></div>
                      <div style={{ fontSize: 12 }}><strong>Comm:</strong> <span className="muted">{f.communication ?? '—'}</span></div>
                    </div>
                    {f.comments && <p className="mt-2" style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>"{f.comments}"</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="stack" style={{ gap: 16 }}>
          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="flex mb-4" style={{ gap: 16, alignItems: 'center' }}>
              {c.profile_image ? (
                <img src={`${baseURL}/files/${c.profile_image}?token=${localStorage.getItem('hr_token')}`} alt="DP" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              ) : (
                <div style={{ border: '3px solid #fff', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Avatar name={c.name} size={64} />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || '—'}</div>
                <div className="muted" style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email || '—'}</div>
              </div>
            </div>
            <div className="divider" style={{ margin: '20px 0' }} />
            <div className="stack" style={{ gap: 12 }}>
              <Info label="Phone" value={c.phone} />
              <Info label="College" value={c.college_name} />
              <Info label="Branch" value={c.branch} />
              <Info label="Degree" value={c.degree} />
              <Info label="Grad year" value={c.graduation_year} />
              <Info label="CGPA" value={c.cgpa} />
              <Info label="10th %" value={c.tenth_pct} />
              <Info label="12th %" value={c.twelfth_pct} />
              <Info label="Backlogs" value={c.backlogs} />
              <Info label="Experience" value={c.experience_years ? `${c.experience_years} yrs` : null} />
            </div>
            {resumeFile ? (
              <a className="btn-soft btn-block mt-6" href={`${baseURL}/files/${resumeFile}?token=${localStorage.getItem('hr_token')}`} target="_blank" rel="noreferrer" style={{ padding: 12, fontWeight: 600 }}><FileText size={16} style={{ marginRight: 8 }} /> Open resume document</a>
            ) : <p className="muted mt-6" style={{ fontSize: 13 }}>No resume on file.</p>}
          </div>

          {(c.skills || []).length > 0 && (
            <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h4 className="mb-4" style={{ fontSize: 15, fontWeight: 700 }}>Skills</h4>
              <div className="flex wrap" style={{ gap: 6 }}>{(c.skills || []).map((s) => <span key={s} className="chip" style={{ background: '#fff', border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>{s}</span>)}</div>
            </div>
          )}

          {c.summary && (
            <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h4 className="mb-3" style={{ fontSize: 15, fontWeight: 700 }}>Resume Summary</h4>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{c.summary}</p>
            </div>
          )}

          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)', background: 'linear-gradient(to bottom, #fff, var(--surface-2))' }}>
            <h4 className="mb-3" style={{ fontSize: 15, fontWeight: 700 }}>HR Notes</h4>
            <textarea className="input" rows={4} defaultValue={a.hr_notes || ''} onChange={(e) => setNotes(e.target.value)} placeholder="Add private internal notes…" style={{ resize: 'vertical', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 14 }} />
            <button className="btn-primary btn-block mt-4" onClick={saveNotes} style={{ padding: 10, fontWeight: 600, borderRadius: 8 }}>Save notes</button>
          </div>

          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h4 className="mb-4" style={{ fontSize: 15, fontWeight: 700 }}>Stage History</h4>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 8, top: 10, bottom: 20, width: 2, background: 'var(--brand-100)', borderRadius: 2 }} />
              {history.map((h, i) => (
                <div key={h.id || i} className="mb-5" style={{ position: 'relative', paddingLeft: 28 }}>
                  <div style={{ position: 'absolute', left: 4, top: 4, width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--brand-500)' : 'var(--brand-300)', border: '2px solid #fff' }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: i === 0 ? 'var(--text)' : 'var(--text-2)' }}>{h.from_stage ? `${h.from_stage} → ` : ''}{h.to_stage}</div>
                  <div className="muted mt-1" style={{ fontSize: 12 }}>{h.by || h.changed_by || 'System'} <span style={{ opacity: 0.5 }}>·</span> {fmtDate(h.created_at)}</div>
                  {h.note && <div className="mt-2" style={{ fontSize: 13, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-light)' }}>{h.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={ivModal} onClose={() => setIvModal(false)} title="Schedule Interview"
        footer={<><button className="btn-ghost" onClick={() => setIvModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={scheduleIv}>Schedule</button></>}>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ width: 90 }}><label>Round #</label><input className="input" type="number" value={iv.round_no || 1} onChange={(e) => setIv({ ...iv, round_no: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>Round name</label><input className="input" value={iv.round_name} onChange={(e) => setIv({ ...iv, round_name: e.target.value })} placeholder="Technical Round" /></div>
          <div className="field" style={{ width: 130 }}><label>Mode</label><select className="select" value={iv.mode} onChange={(e) => setIv({ ...iv, mode: e.target.value })}><option>Online</option><option>In-person</option><option>Phone</option></select></div>
        </div>
        <div className="field"><label>Date & time</label><input className="input" type="datetime-local" value={iv.scheduled_at} onChange={(e) => setIv({ ...iv, scheduled_at: e.target.value })} /></div>
        <div className="field"><label>Meeting link / location</label><input className="input" value={iv.location} onChange={(e) => setIv({ ...iv, location: e.target.value })} /></div>
        <div className="field"><label>Instructions</label><textarea className="input" rows={2} value={iv.instructions || ''} onChange={(e) => setIv({ ...iv, instructions: e.target.value })} /></div>
        <div className="field"><label>Interviewers</label>
          <div className="stack" style={{ gap: 5, maxHeight: 130, overflowY: 'auto' }}>
            {interviewerList.map((u) => (
              <label key={u.id} className="flex" style={{ fontSize: 13 }}>
                <input type="checkbox" checked={(iv.interviewer_ids || []).includes(u.id)}
                  onChange={(e) => setIv({ ...iv, interviewer_ids: e.target.checked ? [...(iv.interviewer_ids || []), u.id] : (iv.interviewer_ids || []).filter((x) => x !== u.id) })} />
                {u.name} <span className="muted">({u.role})</span>
              </label>
            ))}
            {interviewerList.length === 0 && <span className="muted">No HR/Admin users available.</span>}
          </div>
        </div>
      </Modal>

      {joinedMoveConfirm && (
        <JoinedConfirmModal 
          onConfirm={() => {
            setStage(joinedMoveConfirm)
            setJoinedMoveConfirm(null)
          }}
          onCancel={() => setJoinedMoveConfirm(null)}
        />
      )}
    </div>
  )
}

function JoinedConfirmModal({ onConfirm, onCancel }) {
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    if (seconds <= 0) {
      onCancel()
      return
    }
    const timer = setTimeout(() => {
      setSeconds(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [seconds, onCancel])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000
    }}>
      <div className="card card-pad" style={{ width: 400, textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--red-600)' }}>Warning: Candidate Joined</h3>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          This candidate has already reached the final <strong>Joined</strong> stage. Are you sure you want to move them back?
        </p>
        <div className="flex" style={{ gap: 12, justifyContent: 'center' }}>
          <button 
            className="btn-soft" 
            style={{ padding: '10px 20px', fontWeight: 600 }}
            onClick={onCancel}
          >
            No (Auto-cancel in {seconds}s)
          </button>
          <button 
            className="btn-danger" 
            style={{ padding: '10px 20px', fontWeight: 600 }}
            onClick={onConfirm}
          >
            Yes, Move Back
          </button>
        </div>
      </div>
    </div>
  )
}
function Info({ label, value }) {
  return (
    <div className="row-between" style={{ padding: '10px 0', borderBottom: '1px dashed var(--border-light)' }}>
      <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 13.5, textAlign: 'right', color: 'var(--text)', maxWidth: '60%', wordBreak: 'break-word' }}>{value || '—'}</span>
    </div>
  )
}
function MiniStat({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '18px 12px', background: 'linear-gradient(135deg, var(--brand-50), #fff)', borderRadius: 14, border: '1px solid var(--brand-100)', boxShadow: '0 4px 12px rgba(197, 48, 123, 0.04)' }}>
      <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--brand-700)', letterSpacing: '-0.5px' }}>{value}</div>
      <div className="muted mt-1" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  )
}


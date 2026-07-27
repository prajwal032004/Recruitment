import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  KanbanSquare, UserPlus, Calendar, Star, CheckCircle, XCircle, Clock,
  FileText, ShieldCheck, ArrowRight, UserCheck, AlertCircle, Filter, Plus, ChevronRight
} from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner, Avatar, Badge, Modal } from '../../components/UI'

export default function JDPipelineView() {
  const { deptSlug, jobId } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [pipelineData, setPipelineData] = useState(null)
  const [activeJobId, setActiveJobId] = useState(jobId ? parseInt(jobId) : null)
  const [allJobs, setAllJobs] = useState([])

  // Modal states
  const [sourceModal, setSourceModal] = useState(false)
  const [sourceForm, setSourceForm] = useState({ name: '', email: '', phone: '', skills: '', experience_years: 2 })
  const [sourcingBusy, setSourcingBusy] = useState(false)

  const [selectedApp, setSelectedApp] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [appHistory, setAppHistory] = useState([])

  // Schedule Interview modal
  const [scheduleModal, setScheduleModal] = useState(false)
  const [schedForm, setSchedForm] = useState({
    round_no: 1,
    round_name: 'Interview Round 1',
    mode: 'Online',
    scheduled_at: '',
    location: 'Google Meet / MS Teams Link',
    instructions: 'Technical depth & architecture assessment'
  })
  const [schedBusy, setSchedBusy] = useState(false)

  // Feedback & Pass/Fail Verdict Modal
  const [verdictModal, setVerdictModal] = useState(false)
  const [verdictForm, setVerdictForm] = useState({
    verdict: 'Pass', // Pass or Fail
    overall_rating: 5,
    technical: 5,
    problem_solving: 4,
    communication: 5,
    strengths: 'Excellent technical clarity and domain knowledge',
    concerns: 'None',
    comments: 'Strong recommendation to advance'
  })
  const [verdictBusy, setVerdictBusy] = useState(false)

  const PIPELINE_STAGES = [
    'Applied', 'Resume Screening', 'Shortlisted', 'Assessment',
    'Interview Round 1', 'Interview Round 2', 'Managerial Interview', 'HR Interview',
    'Selected', 'Offered', 'Hired'
  ]

  // Load all jobs/hiring requests for department switcher
  useEffect(() => {
    let active = true
    async function loadDepartmentJobs() {
      try {
        const reqs = await apiGet('/manager/hiring-requests')
        if (active && reqs && reqs.length > 0) {
          const validJobs = reqs.filter(r => r.job_id).map(r => ({
            job_id: r.job_id,
            title: r.title,
            req_id: r.id,
            openings: r.openings
          }))
          setAllJobs(validJobs)
          if (!activeJobId && validJobs.length > 0) {
            setActiveJobId(validJobs[0].job_id)
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadDepartmentJobs()
    return () => { active = false }
  }, [slug])

  // Load candidate pipeline for current activeJobId
  useEffect(() => {
    if (!activeJobId) return
    let active = true
    async function fetchPipeline() {
      setLoading(true)
      try {
        const res = await apiGet(`/manager/jd-pipeline/${activeJobId}`)
        if (active) {
          setPipelineData(res)
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load candidate pipeline for this position.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchPipeline()
  }, [activeJobId])

  // Add Candidate to Applied Section
  const handleSourceCandidate = async (e) => {
    e.preventDefault()
    if (!sourceForm.name || !sourceForm.email) return toast.error('Name and Email are required.')
    setSourcingBusy(true)
    try {
      const activeReq = allJobs.find(j => j.job_id === activeJobId)
      const reqId = activeReq ? activeReq.req_id : 1
      const res = await apiPost(`/manager/hiring-requests/${reqId}/source-candidate`, sourceForm)
      toast.success(`Candidate ${sourceForm.name} added to 'Applied' section!`)
      setSourceModal(false)
      setSourceForm({ name: '', email: '', phone: '', skills: '', experience_years: 2 })
      // Refresh pipeline
      const fresh = await apiGet(`/manager/jd-pipeline/${activeJobId}`)
      setPipelineData(fresh)
    } catch (err) {
      toast.error(err.message || 'Failed to add candidate.')
    } finally {
      setSourcingBusy(false)
    }
  }

  // Open detail modal for candidate
  const openAppDetail = async (app) => {
    setSelectedApp(app)
    setDetailModal(true)
    try {
      const res = await apiGet(`/applications/${app.id}`)
      setSelectedApp(res)
      setAppHistory(res.history || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Schedule Interview
  const handleScheduleInterview = async (e) => {
    e.preventDefault()
    if (!selectedApp) return
    setSchedBusy(true)
    try {
      await apiPost('/interviews', {
        application_id: selectedApp.id,
        round_no: schedForm.round_no,
        round_name: schedForm.round_name,
        mode: schedForm.mode,
        scheduled_at: schedForm.scheduled_at || new Date().toISOString(),
        location: schedForm.location,
        instructions: schedForm.instructions
      })
      toast.success(`Interview Scheduled: ${schedForm.round_name} for ${selectedApp.candidate_name}!`)
      setScheduleModal(false)
      // Refresh application detail
      const res = await apiGet(`/applications/${selectedApp.id}`)
      setSelectedApp(res)
      const fresh = await apiGet(`/manager/jd-pipeline/${activeJobId}`)
      setPipelineData(fresh)
    } catch (err) {
      toast.error(err.message || 'Failed to schedule interview.')
    } finally {
      setSchedBusy(false)
    }
  }

  // Submit Pass / Fail Verdict & Automated Stage Progression
  const handleSubmitVerdict = async (iid, verdict) => {
    if (!selectedApp) return
    setVerdictBusy(true)
    try {
      const res = await apiPost(`/interviews/${iid}/verdict`, {
        verdict: verdict,
        overall_rating: verdictForm.overall_rating,
        technical: verdictForm.technical,
        problem_solving: verdictForm.problem_solving,
        communication: verdictForm.communication,
        strengths: verdictForm.strengths,
        concerns: verdictForm.concerns,
        comments: verdictForm.comments
      })
      toast.success(`Verdict '${verdict}' recorded! ${verdict === 'Pass' ? 'Candidate automatically advanced to next stage.' : 'Candidate moved to Rejected.'}`)
      setVerdictModal(false)
      // Refresh detail & pipeline
      const updated = await apiGet(`/applications/${selectedApp.id}`)
      setSelectedApp(updated)
      setAppHistory(updated.history || [])
      const fresh = await apiGet(`/manager/jd-pipeline/${activeJobId}`)
      setPipelineData(fresh)
    } catch (err) {
      toast.error(err.message || 'Failed to record verdict.')
    } finally {
      setVerdictBusy(false)
    }
  }

  // Manual Stage Change
  const handleStageChange = async (appId, newStage) => {
    try {
      await apiPut(`/applications/${appId}/stage`, { stage: newStage })
      toast.success(`Candidate stage moved to ${newStage}`)
      const updated = await apiGet(`/applications/${appId}`)
      setSelectedApp(updated)
      const fresh = await apiGet(`/manager/jd-pipeline/${activeJobId}`)
      setPipelineData(fresh)
    } catch (err) {
      toast.error(err.message || 'Failed to update stage.')
    }
  }

  if (loading && !pipelineData) return <LoadingSpinner full label="Loading Independent JD Recruitment Pipeline..." />

  const jobTitle = pipelineData?.job?.title || 'Selected Requisition'

  return (
    <div className="stack" style={{ gap: 24 }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Independent Recruitment Pipeline
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0 0', color: '#0f172a' }}>
            {jobTitle}
          </h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            Isolated candidate tracking per Job Description (JD) without data mixing
          </div>
        </div>

        <div className="flex wrap" style={{ gap: 12, alignItems: 'center' }}>
          {/* Position Selector */}
          {allJobs.length > 0 && (
            <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
              <Filter size={16} color="#64748b" />
              <select
                className="input"
                value={activeJobId || ''}
                onChange={(e) => setActiveJobId(parseInt(e.target.value))}
                style={{ borderRadius: 8, height: 40, fontWeight: 700, fontSize: 13 }}
              >
                {allJobs.map(j => (
                  <option key={j.job_id} value={j.job_id}>
                    JD: {j.title} ({j.openings} openings)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setSourceModal(true)}
            className="btn-primary flex"
            style={{ gap: 8, borderRadius: 8, height: 40, padding: '0 18px', fontWeight: 700, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <UserPlus size={18} />
            <span>Add / Source Candidate to 'Applied'</span>
          </button>
        </div>
      </div>

      {/* Kanban Board - Horizontally scrollable container */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 20,
          minHeight: 520,
        }}
      >
        {PIPELINE_STAGES.map((stage) => {
          const stageApps = pipelineData?.columns?.[stage] || []
          return (
            <div
              key={stage}
              style={{
                flex: '0 0 280px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '75vh',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{stage}</span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: stageApps.length > 0 ? '#4f46e5' : '#e2e8f0',
                    color: stageApps.length > 0 ? '#ffffff' : '#64748b',
                  }}
                >
                  {stageApps.length}
                </span>
              </div>

              {/* Candidates List */}
              <div style={{ padding: 12, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stageApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
                    No candidates in {stage}
                  </div>
                ) : (
                  stageApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => openAppDetail(app)}
                      className="card"
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <Avatar name={app.candidate_name} size={32} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                            {app.candidate_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {app.candidate_email}
                          </div>
                        </div>
                      </div>

                      {app.candidate_skills && app.candidate_skills.length > 0 && (
                        <div className="flex wrap" style={{ gap: 4, marginBottom: 8 }}>
                          {app.candidate_skills.slice(0, 3).map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: '#f1f5f9', borderRadius: 4, color: '#475569' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
                        <span style={{ fontWeight: 600 }}>Source: {app.source || 'DIRECT'}</span>
                        <ChevronRight size={14} color="#94a3b8" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Source Candidate Modal */}
      <Modal isOpen={sourceModal} onClose={() => setSourceModal(false)} title={`Add / Source Candidate for ${jobTitle}`}>
        <form onSubmit={handleSourceCandidate} className="stack" style={{ gap: 16 }}>
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Candidate Full Name *</label>
            <input type="text" className="input" required value={sourceForm.name} onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })} placeholder="e.g. Alex Johnson" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13 }}>Email Address *</label>
              <input type="email" className="input" required value={sourceForm.email} onChange={(e) => setSourceForm({ ...sourceForm, email: e.target.value })} placeholder="alex@example.com" />
            </div>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13 }}>Phone Number</label>
              <input type="text" className="input" value={sourceForm.phone} onChange={(e) => setSourceForm({ ...sourceForm, phone: e.target.value })} placeholder="+1 555-0192" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13 }}>Skills (Comma Separated)</label>
              <input type="text" className="input" value={sourceForm.skills} onChange={(e) => setSourceForm({ ...sourceForm, skills: e.target.value })} placeholder="React, Node.js, Python" />
            </div>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13 }}>Experience (Years)</label>
              <input type="number" step="0.5" className="input" value={sourceForm.experience_years} onChange={(e) => setSourceForm({ ...sourceForm, experience_years: e.target.value })} />
            </div>
          </div>

          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={() => setSourceModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={sourcingBusy} className="btn-primary" style={{ background: '#10b981' }}>
              {sourcingBusy ? 'Adding Candidate...' : 'Add to Applied Section'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Candidate Detail & Pass/Fail Evaluation Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={`Candidate Evaluation: ${selectedApp?.candidate_name || 'Details'}`}>
        {selectedApp && (
          <div className="stack" style={{ gap: 20 }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <Avatar name={selectedApp.candidate_name} size={48} />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedApp.candidate_name}</h3>
                <div style={{ fontSize: 13, color: '#64748b' }}>{selectedApp.candidate_email} • {selectedApp.candidate_phone || 'No Phone'}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <Badge variant="badge-violet">Stage: {selectedApp.stage}</Badge>
                  <Badge variant={selectedApp.status === 'Rejected' ? 'badge-red' : 'badge-green'}>Status: {selectedApp.status}</Badge>
                </div>
              </div>
            </div>

            {/* Quick Stage Transitions */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Advance or Move Stage Manually
              </div>
              <div className="flex wrap" style={{ gap: 6 }}>
                {PIPELINE_STAGES.map(st => (
                  <button
                    key={st}
                    onClick={() => handleStageChange(selectedApp.id, st)}
                    className={`btn-sm ${selectedApp.stage === st ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Interviews & Pass/Fail evaluation list */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  Interview Rounds & Evaluation Verdicts
                </div>
                <button
                  onClick={() => setScheduleModal(true)}
                  className="btn-primary btn-sm flex"
                  style={{ gap: 6, borderRadius: 6 }}
                >
                  <Calendar size={14} /> Schedule Interview Round
                </button>
              </div>

              {selectedApp.interviews && selectedApp.interviews.length > 0 ? (
                <div className="stack" style={{ gap: 10 }}>
                  {selectedApp.interviews.map(iv => (
                    <div key={iv.id} style={{ padding: 14, borderRadius: 10, border: '1px solid #cbd5e1', background: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>{iv.round_name}</strong>
                          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({iv.mode})</span>
                        </div>
                        <Badge variant={iv.result === 'Pass' ? 'badge-green' : iv.result === 'Fail' ? 'badge-red' : 'badge-yellow'}>
                          Verdict: {iv.result || 'Pending'}
                        </Badge>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Location/Link: {iv.location || 'Online'}
                      </div>

                      {/* Action to submit Pass/Fail verdict */}
                      <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                          onClick={() => handleSubmitVerdict(iv.id, 'Pass')}
                          className="btn-sm flex"
                          style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, gap: 4, fontWeight: 700 }}
                        >
                          <CheckCircle size={14} /> Mark Pass (Advance Stage)
                        </button>
                        <button
                          onClick={() => handleSubmitVerdict(iv.id, 'Fail')}
                          className="btn-sm flex"
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, gap: 4, fontWeight: 700 }}
                        >
                          <XCircle size={14} /> Mark Fail (Reject Candidate)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No interviews scheduled yet for this candidate. Click 'Schedule Interview Round' above.
                </div>
              )}
            </div>

            {/* Stage Change Decision Logs */}
            {appHistory.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  Complete Decision & Progression History
                </div>
                <div className="stack" style={{ gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {appHistory.map(h => (
                    <div key={h.id} style={{ fontSize: 12, padding: '6px 10px', background: '#f1f5f9', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{h.to_stage}</strong> — {h.note}</span>
                      <span style={{ color: '#64748b' }}>by {h.by}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal isOpen={scheduleModal} onClose={() => setScheduleModal(false)} title={`Schedule Interview Round for ${selectedApp?.candidate_name}`}>
        <form onSubmit={handleScheduleInterview} className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Select Interview Round</label>
            <select
              className="input"
              value={schedForm.round_name}
              onChange={(e) => setSchedForm({ ...schedForm, round_name: e.target.value })}
            >
              <option value="Interview Round 1">Interview Round 1 (Technical Screening)</option>
              <option value="Interview Round 2">Interview Round 2 (System Design / Deep Dive)</option>
              <option value="Managerial Interview">Managerial Interview (Culture & Alignment)</option>
              <option value="HR Interview">HR Interview (Compensation & Background)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13 }}>Mode</label>
              <select className="input" value={schedForm.mode} onChange={(e) => setSchedForm({ ...schedForm, mode: e.target.value })}>
                <option value="Online">Online Video Call</option>
                <option value="In-Person">In-Person Office</option>
                <option value="Phone">Phone Screen</option>
              </select>
            </div>

            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13 }}>Meeting Link / Location</label>
              <input type="text" className="input" value={schedForm.location} onChange={(e) => setSchedForm({ ...schedForm, location: e.target.value })} />
            </div>
          </div>

          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Instructions for Interviewer</label>
            <textarea className="input" rows={2} value={schedForm.instructions} onChange={(e) => setSchedForm({ ...schedForm, instructions: e.target.value })} />
          </div>

          <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={() => setScheduleModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={schedBusy} className="btn-primary">
              {schedBusy ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

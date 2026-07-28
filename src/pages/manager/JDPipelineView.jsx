import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  KanbanSquare, Calendar, Star, CheckCircle, XCircle, Clock,
  FileText, ShieldCheck, ArrowRight, UserCheck, AlertCircle, Filter, ChevronRight, Eye, Mail, Phone, Award
} from 'lucide-react'
import { apiGet } from '../../api/client'
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

  const [selectedApp, setSelectedApp] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [appHistory, setAppHistory] = useState([])

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
        const reqs = await apiGet(`/manager/hiring-requests?dept_slug=${slug}`)
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
        toast.error(err.message || 'Failed to load recruitment pipeline.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchPipeline()
    return () => { active = false }
  }, [activeJobId])

  // Open Application Detail Modal (Read-Only)
  const openAppDetail = async (app) => {
    setSelectedApp(app)
    setDetailModal(true)
    try {
      const res = await apiGet(`/applications/${app.id}`)
      if (res) {
        setSelectedApp(res.application || res)
        setAppHistory(res.stage_history || res.history || [])
      }
    } catch (err) {
      console.error('Failed to load application history:', err)
    }
  }

  if (loading && !pipelineData) return <LoadingSpinner full label="Loading Department Recruitment Pipeline..." />

  const jobTitle = pipelineData?.job?.title || 'Selected Requisition'

  return (
    <div className="stack" style={{ gap: 24, maxWidth: 1400, margin: '0 auto', paddingBottom: 50 }}>
      {/* Read-Only Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '24px 28px',
          borderRadius: 20,
          color: '#ffffff',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.25)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: 0.6
              }}
            >
              READ ONLY CANDIDATE TRACKING DESK
            </span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
            {jobTitle}
          </h1>

          <p style={{ margin: 0, fontSize: 13.5, color: '#cbd5e1', maxWidth: 640 }}>
            Track real-time stage progression of your department candidates as they advance through interview rounds, assessments, and offer stages.
          </p>
        </div>

        <div className="flex wrap" style={{ gap: 12, alignItems: 'center' }}>
          {/* Position Selector */}
          {allJobs.length > 0 && (
            <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
              <Filter size={16} color="#94a3b8" />
              <select
                className="input"
                value={activeJobId || ''}
                onChange={(e) => setActiveJobId(parseInt(e.target.value))}
                style={{
                  borderRadius: 10,
                  height: 42,
                  fontWeight: 700,
                  fontSize: 13.5,
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  padding: '0 14px'
                }}
              >
                {allJobs.map(j => (
                  <option key={j.job_id} value={j.job_id}>
                    Position: {j.title} ({j.openings} openings)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board Container - Read Only Pipeline */}
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
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '75vh',
                boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
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
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{stage}</span>
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '2px 9px',
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
                  <div style={{ textAlign: 'center', padding: '36px 10px', color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
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
                        borderRadius: 12,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'transform 0.15s ease, boxShadow 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <Avatar name={app.candidate_name} size={34} style={{ border: '2px solid #818cf8' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {app.candidate_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {app.candidate_email}
                          </div>
                        </div>
                      </div>

                      {app.candidate_skills && app.candidate_skills.length > 0 && (
                        <div className="flex wrap" style={{ gap: 4, marginBottom: 8 }}>
                          {app.candidate_skills.slice(0, 3).map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: '#e0e7ff', borderRadius: 4, color: '#3730a3' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                        <span style={{ fontWeight: 600 }}>Source: {app.source || 'DIRECT'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#4f46e5', fontWeight: 700 }}>
                          <span>View Info</span>
                          <Eye size={12} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Read-Only Candidate Progress & Evaluation Modal */}
      {detailModal && selectedApp && (
        <Modal
          open={true}
          onClose={() => setDetailModal(false)}
          title={`Candidate Tracking View: ${selectedApp.candidate_name || 'Details'}`}
          width={680}
        >
          <div className="stack" style={{ gap: 20 }}>
            {/* Header info card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '18px 22px', borderRadius: 16, color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={selectedApp.candidate_name} size={48} style={{ border: '2px solid #818cf8' }} />
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                    {selectedApp.candidate_name}
                  </h3>
                  <div style={{ fontSize: 12.5, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span><Mail size={12} style={{ display: 'inline', marginRight: 3 }} />{selectedApp.candidate_email}</span>
                    {selectedApp.candidate_phone && <span><Phone size={12} style={{ display: 'inline', marginRight: 3 }} />{selectedApp.candidate_phone}</span>}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Badge variant={selectedApp.stage === 'Hired' || selectedApp.stage === 'Offered' ? 'success' : selectedApp.stage === 'Rejected' ? 'danger' : 'info'}>
                  {selectedApp.stage || 'Applied'}
                </Badge>
                <div style={{ fontSize: 11.5, color: '#38bdf8', fontWeight: 700, marginTop: 4 }}>
                  Match Score: {selectedApp.match_score ? Math.round(selectedApp.match_score) : 85}%
                </div>
              </div>
            </div>

            {/* Read-Only Current Stage Status Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Current Pipeline Location</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#4f46e5', marginTop: 2 }}>
                  {selectedApp.stage || 'Applied'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Candidate Status</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedApp.status === 'Rejected' ? '#ef4444' : '#10b981', marginTop: 2 }}>
                  {selectedApp.status || 'Active'}
                </div>
              </div>
            </div>

            {/* Scheduled Interviews & Evaluation History (Read-Only) */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                Interview Rounds & Evaluation Verdicts
              </div>

              {selectedApp.interviews && selectedApp.interviews.length > 0 ? (
                <div className="stack" style={{ gap: 10 }}>
                  {selectedApp.interviews.map(iv => (
                    <div key={iv.id} style={{ padding: 14, borderRadius: 12, border: '1px solid #cbd5e1', background: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>{iv.round_name}</strong>
                          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({iv.mode || 'Online'})</span>
                        </div>
                        <Badge variant={iv.result === 'Pass' ? 'success' : iv.result === 'Fail' ? 'danger' : 'warning'}>
                          Verdict: {iv.result || 'Pending'}
                        </Badge>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                        Interviewer / Location: {iv.location || 'Online'}
                      </div>

                      {iv.feedback_notes && (
                        <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#334155', fontStyle: 'italic' }}>
                          {iv.feedback_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, textAlign: 'center', color: '#64748b', fontSize: 13, border: '1px dashed #cbd5e1' }}>
                  No interview rounds recorded yet for this candidate.
                </div>
              )}
            </div>

            {/* Complete Progression History Timeline */}
            {appHistory.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                  Progression History & Movement Logs
                </div>
                <div className="stack" style={{ gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                  {appHistory.map((h, i) => (
                    <div key={i} style={{ fontSize: 12, padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><strong>{h.to_stage}</strong> - {h.note || 'Stage updated'}</span>
                      <span style={{ color: '#64748b', fontSize: 11 }}>by {h.by || h.changed_by_name || 'System'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDetailModal(false)}
                style={{ fontWeight: 700 }}
              >
                Close Tracking View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  UserCheck, Filter, CheckCircle2, Search, Building2, Briefcase, Mail, Phone,
  Award, FileText, Check, X, Sparkles, Clock, AlertCircle, ArrowUpRight, UserPlus,
  ChevronRight, Layers, Target, ThumbsUp, Eye
} from 'lucide-react'
import { apiGet, apiPost } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner, Avatar, Badge, Modal } from '../../components/UI'

export default function ManagerSourcing() {
  const { deptSlug } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [hiringRequests, setHiringRequests] = useState([])
  const [selectedReqId, setSelectedReqId] = useState(null)
  const [sourcedCandidates, setSourcedCandidates] = useState([])
  const [verifiedMap, setVerifiedMap] = useState({}) // appId -> 'APPROVED' | 'REJECTED'

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    experience_years: 3
  })
  const [busy, setBusy] = useState(false)

  // Candidate detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCandDetail, setSelectedCandDetail] = useState(null)

  const openCandidateDetail = (app) => {
    setSelectedCandDetail(app)
    setDetailModalOpen(true)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const reqs = await apiGet(`/manager/hiring-requests?dept_slug=${slug}`)
      const deptReqs = (reqs || []).filter(r => {
        if (!r) return false
        const rSlug = (r.department_slug || '').toLowerCase()
        const rDeptName = (r.department_name || '').toLowerCase().replace(/\s+/g, '-')
        return rSlug === slug || rDeptName === slug || slug.includes(rSlug) || rSlug.includes(slug)
      })
      setHiringRequests(deptReqs)
      if (deptReqs.length > 0) {
        if (!selectedReqId || !deptReqs.some(r => r.id === selectedReqId)) {
          setSelectedReqId(deptReqs[0].id)
        }
      } else {
        setSelectedReqId(null)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load requisitions for your department.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [slug])

  // Load sourced candidates when selectedReqId changes
  useEffect(() => {
    if (!selectedReqId) return
    async function loadReqDetail() {
      try {
        const detail = await apiGet(`/manager/hiring-requests/${selectedReqId}`)
        setSourcedCandidates(detail.applications || [])
      } catch (err) {
        console.error(err)
      }
    }
    loadReqDetail()
  }, [selectedReqId])

  const selectedReq = hiringRequests.find(r => r.id === selectedReqId) || hiringRequests[0]

  const handleVerifyCandidate = async (appId, status) => {
    setVerifiedMap(prev => ({ ...prev, [appId]: status }))
    try {
      await apiPost(`/manager/hiring-requests/${selectedReqId}/verify-candidate`, {
        application_id: appId,
        status: status
      })
      if (status === 'APPROVED') {
        toast.success('Candidate cross-verified & approved for interviews!')
      } else {
        toast.info('Candidate marked as rejected.')
      }
      // Refresh list
      const detail = await apiGet(`/manager/hiring-requests/${selectedReqId}`)
      setSourcedCandidates(detail.applications || [])
    } catch (err) {
      toast.error(err.message || 'Failed to update candidate verification status.')
    }
  }

  const handleSourceCandidate = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return toast.error('Candidate name and email are required.')
    if (!selectedReqId) return toast.error('Please select a hiring request position.')

    setBusy(true)
    try {
      await apiPost(`/manager/hiring-requests/${selectedReqId}/source-candidate`, form)
      toast.success(`Candidate ${form.name} successfully added for verification!`)
      setModalOpen(false)
      setForm({ name: '', email: '', phone: '', skills: '', experience_years: 3 })
      // Refresh candidates
      const detail = await apiGet(`/manager/hiring-requests/${selectedReqId}`)
      setSourcedCandidates(detail.applications || [])
    } catch (err) {
      toast.error(err.message || 'Failed to add candidate.')
    } finally {
      setBusy(false)
    }
  }

  const approvedCount = sourcedCandidates.filter(a => a.stage === 'Shortlisted' || verifiedMap[a.id] === 'APPROVED').length
  const totalNeeded = selectedReq ? (selectedReq.openings || 1) : 1

  const handleCompleteVerification = async () => {
    if (!selectedReqId) return
    try {
      await apiPost(`/manager/hiring-requests/${selectedReqId}/complete-verification`)
      toast.success(`Verification complete! Requisition #${selectedReqId} approved & sent to HR/Recruitment Admin.`)
      const reqs = await apiGet('/manager/hiring-requests')
      setHiringRequests(reqs || [])
    } catch (err) {
      toast.error(err.message || 'Failed to complete verification.')
    }
  }

  if (loading) return <LoadingSpinner full label="Loading candidate verification desk..." />

  return (
    <div style={{ paddingBottom: 60, maxWidth: 1280, margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        className="dept-mgr-hero"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #831f51 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: 28,
          boxShadow: '0 16px 36px -10px rgba(15, 23, 42, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative background circle */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                MANAGER ACTION DESK
              </span>
              <span style={{ fontSize: 12.5, color: '#cbd5e1', fontWeight: 600 }}>
                DEPARTMENT: <strong style={{ color: '#ffffff' }}>{slug.toUpperCase()}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.4px', color: '#ffffff' }}>
              Candidate Review & Verification
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', maxWidth: 640, lineHeight: 1.5 }}>
              Cross-verify candidates submitted for your requisitions. Approve qualified candidates up to your requested headcount target.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="dept-mgr-hero-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ffffff',
              color: '#312e81',
              border: 'none',
              borderRadius: 12,
              padding: '12px 22px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.15s ease, boxShadow 0.15s ease'
            }}
          >
            <UserPlus size={18} />
            <span>Add Candidate for Review</span>
          </button>
        </div>
      </div>

      {/* Requisition Selector Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 28,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 300 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Briefcase size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
              SELECTED REQUISITION POSITION
            </div>

            <select
              value={selectedReqId || ''}
              onChange={(e) => setSelectedReqId(Number(e.target.value))}
              style={{
                width: '100%',
                maxWidth: 540,
                fontWeight: 700,
                fontSize: 14,
                color: '#0f172a',
                height: 42,
                padding: '0 16px',
                borderRadius: 12,
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              {hiringRequests.map(r => (
                <option key={r.id} value={r.id}>
                  #{r.id} — {r.title} ({r.openings} opening{r.openings > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedReq && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc', padding: '10px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={16} color="#64748b" />
              <span style={{ fontSize: 13, color: '#64748b' }}>Target Openings:</span>
              <strong style={{ fontSize: 15, color: '#0f172a' }}>{selectedReq.openings}</strong>
            </div>

            <div style={{ width: 1, height: 20, background: '#cbd5e1' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ThumbsUp size={16} color={approvedCount >= totalNeeded ? '#10b981' : '#6366f1'} />
              <span style={{ fontSize: 13, color: '#64748b' }}>Approved:</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: approvedCount >= totalNeeded ? '#d1fae5' : '#e0e7ff',
                  color: approvedCount >= totalNeeded ? '#065f46' : '#3730a3'
                }}
              >
                {approvedCount} / {totalNeeded}
              </span>
            </div>

            {approvedCount > 0 && (
              <button
                onClick={handleCompleteVerification}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                <CheckCircle2 size={15} />
                <span>Mark Done</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Candidates List for Review */}
      {sourcedCandidates.length === 0 ? (
        <div
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 20,
            border: '2px dashed #cbd5e1',
            padding: '60px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#e0e7ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 10px 25px rgba(79, 70, 229, 0.15)'
            }}
          >
            <UserCheck size={36} />
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            No Candidates Submitted Yet
          </h3>

          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 500, margin: '0 0 24px 0', lineHeight: 1.6 }}>
            HR & Recruitment Admin are actively sourcing profiles matching <strong>{selectedReq?.title || 'this position'}</strong>. You can also manually add prospective candidates below.
          </p>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)'
            }}
          >
            <UserPlus size={18} />
            <span>Add Candidate Manually</span>
          </button>
        </div>
      ) : (
        <div className="dept-cand-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
          {sourcedCandidates.map((app) => {
            const status = verifiedMap[app.id] || (app.stage === 'Shortlisted' ? 'APPROVED' : app.stage === 'Rejected' ? 'REJECTED' : null)
            const skillsList = app.candidate_skills || []
            return (
              <div
                key={app.id}
                style={{
                  borderRadius: 16,
                  border: status === 'APPROVED' ? '2px solid #10b981' : status === 'REJECTED' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s ease, boxShadow 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={app.candidate_name || 'Candidate'} size={44} style={{ border: '2px solid #818cf8' }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{app.candidate_name}</h3>
                        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Mail size={12} /> {app.candidate_email || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {status ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                          color: status === 'APPROVED' ? '#065f46' : '#991b1b'
                        }}
                      >
                        {status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>
                        Pending Review
                      </span>
                    )}
                  </div>

                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>Current Stage:</span>
                      <strong style={{ color: '#0f172a' }}>{app.stage || 'Applied'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Resume Match Score:</span>
                      <strong style={{ color: '#0284c7' }}>{app.match_score ? Math.round(app.match_score) : 85}% Match</strong>
                    </div>
                  </div>

                  {skillsList.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {skillsList.slice(0, 4).map((s, idx) => (
                        <span key={idx} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#e0e7ff', color: '#3730a3' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mgr-card-actions" style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => openCandidateDetail(app)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      background: '#eef2ff',
                      color: '#4f46e5',
                      border: '1px solid #c7d2fe',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="View candidate full profile"
                  >
                    <Eye size={15} />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => handleVerifyCandidate(app.id, 'APPROVED')}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      background: status === 'APPROVED' ? '#10b981' : '#f1f5f9',
                      color: status === 'APPROVED' ? '#ffffff' : '#0f172a',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={15} />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleVerifyCandidate(app.id, 'REJECTED')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      background: status === 'REJECTED' ? '#ef4444' : '#f1f5f9',
                      color: status === 'REJECTED' ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <X size={15} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal to Add Candidate */}
      {modalOpen && (
        <Modal title={`Add Candidate for ${selectedReq?.title || 'Requisition'}`} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSourceCandidate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Candidate Full Name *</label>
              <input
                type="text"
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                style={{ width: '100%', height: 42, borderRadius: 8 }}
              />
            </div>

            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Candidate Email *</label>
              <input
                type="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="sarah.jenkins@example.com"
                style={{ width: '100%', height: 42, borderRadius: 8 }}
              />
            </div>

            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Phone Number</label>
              <input
                type="text"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555-0192"
                style={{ width: '100%', height: 42, borderRadius: 8 }}
              />
            </div>

            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Key Skills (comma separated)</label>
              <input
                type="text"
                className="input"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                placeholder="React, Node.js, Python, AWS"
                style={{ width: '100%', height: 42, borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy}
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', height: 42, padding: '0 20px', borderRadius: 8 }}
              >
                {busy ? 'Adding...' : 'Add Candidate'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal to View Detailed Candidate Profile */}
      {detailModalOpen && selectedCandDetail && (
        <Modal
          title={`Candidate Profile — ${selectedCandDetail.candidate_name || 'Candidate'}`}
          onClose={() => setDetailModalOpen(false)}
          width={720}
        >
          <div style={{ padding: '4px 0' }}>
            {/* Header Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '20px 24px', borderRadius: 16, color: '#ffffff', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar name={selectedCandDetail.candidate_name || 'Candidate'} size={56} style={{ border: '3px solid #818cf8' }} />
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 800, color: '#ffffff' }}>
                    {selectedCandDetail.candidate_name}
                  </h2>
                  <div style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span><Mail size={13} style={{ display: 'inline', marginRight: 4 }} />{selectedCandDetail.candidate_email || 'N/A'}</span>
                    {selectedCandDetail.candidate_phone && <span><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />{selectedCandDetail.candidate_phone}</span>}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Badge variant={selectedCandDetail.stage === 'Shortlisted' ? 'success' : selectedCandDetail.stage === 'Rejected' ? 'danger' : 'info'}>
                  {selectedCandDetail.stage || 'Applied'}
                </Badge>
                <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700, marginTop: 6 }}>
                  Match Score: {selectedCandDetail.match_score ? Math.round(selectedCandDetail.match_score) : 85}%
                </div>
              </div>
            </div>

            {/* Academic & Background Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>College / Source</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                  {selectedCandDetail.college_name || selectedCandDetail.source || 'Campus Student'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Degree & Branch</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                  {selectedCandDetail.degree || 'B.Tech'} — {selectedCandDetail.branch || 'CSE'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Academic Marks</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginTop: 4 }}>
                  {selectedCandDetail.cgpa ? `CGPA: ${selectedCandDetail.cgpa}` : 'CGPA: N/A'}
                  {selectedCandDetail.tenth_pct ? ` • 10th: ${selectedCandDetail.tenth_pct}%` : ''}
                </div>
              </div>
            </div>

            {/* Skills */}
            {(selectedCandDetail.candidate_skills || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Technical Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedCandDetail.candidate_skills.map((sk, i) => (
                    <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: '#e0e7ff', color: '#3730a3' }}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="row gap-12 justify-end mt-24" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => {
                  handleVerifyCandidate(selectedCandDetail.id, 'REJECTED')
                  setDetailModalOpen(false)
                }}
                className="btn btn-ghost"
                style={{ color: '#ef4444', fontWeight: 700 }}
              >
                <X size={16} /> Reject Candidate
              </button>
              <button
                onClick={() => {
                  handleVerifyCandidate(selectedCandDetail.id, 'APPROVED')
                  setDetailModalOpen(false)
                }}
                className="btn btn-primary"
                style={{ background: '#10b981', fontWeight: 700 }}
              >
                <Check size={16} /> Approve Candidate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

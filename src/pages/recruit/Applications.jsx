import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, CheckCircle2, PauseCircle, XCircle, RotateCcw, Filter } from 'lucide-react'
import { apiGet, apiPut, apiPost, baseURL } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge, Avatar, Pagination } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

export default function Applications() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [source, setSource] = useState('')
  const [eligibility, setEligibility] = useState('')
  const [page, setPage] = useState(1)
  const [hoveredId, setHoveredId] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const toast = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q)
      if (q !== debouncedQ) setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [q, debouncedQ])

  const url = `/applications?search=${encodeURIComponent(debouncedQ)}&source=${source}&eligibility=${eligibility}&page=${page}`
  const { data, loading, error, refetch } = useFetch(url, [debouncedQ, source, eligibility, page])

  const handleStageAction = async (app, action, e) => {
    e.stopPropagation()
    setActionLoading(prev => ({ ...prev, [app.id]: action }))
    try {
      if (action === 'undo_reject') {
        const res = await apiPost(`/applications/${app.id}/undo-reject`)
        toast.success(res.stage ? `Application restored to ${res.stage} stage!` : 'Rejection undone!')
      } else if (action === 'approve') {
        const toStage = ['Applied', 'Eligibility Checked', 'Resume Screened', 'Rejected', 'On Hold'].includes(app.stage) ? 'Shortlisted' : app.stage
        await apiPut(`/applications/${app.id}/stage`, { stage: toStage, status: 'Active' })
        toast.success(`Approved & moved to ${toStage}!`)
      } else if (action === 'on_hold') {
        await apiPut(`/applications/${app.id}/stage`, { status: 'On Hold' })
        toast.success('Application placed On Hold!')
      } else if (action === 'reject') {
        await apiPut(`/applications/${app.id}/stage`, { status: 'Rejected' })
        toast.success('Application marked as Rejected!')
      }
      refetch()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [app.id]: null }))
    }
  }

  return (
    <div className="fade-in">
      <PageHeader title="All Applications" subtitle="Manage, screen, and update applicant statuses in real time." icon={FileText} />
      
      <div className="card flex wrap" style={{ gap: 12, padding: '16px 20px', marginBottom: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 40, background: 'var(--surface-2)' }} placeholder="Search candidate name or email..."
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: 160, background: 'var(--surface-2)' }} value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }}>
          <option value="">All Sources</option>
          <option value="CAREERS">Careers Portal</option>
          <option value="COLLEGE">Campus Drive</option>
          <option value="DIRECT">Direct Upload</option>
          <option value="REFERRAL">Referral</option>
        </select>
        <select className="select" style={{ width: 190, background: 'var(--surface-2)' }} value={eligibility} onChange={(e) => { setEligibility(e.target.value); setPage(1) }}>
          <option value="">All Preference Tiers</option>
          <option value="Highly Preferable">Highly Preferable</option>
          <option value="Preferable">Preferable</option>
          <option value="Considerable">Considerable</option>
          <option value="Not Preferable">Not Preferable</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={refetch} /> :
        (data?.items || []).length === 0 ? (
          <EmptyState icon={FileText} title="No applications found" message="Applications appear here automatically when candidates apply or are uploaded." />
        ) : (
          <>
            <div className="card" style={{ padding: 0 }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job Applied</th>
                    <th>Match & Eligibility</th>
                    <th>Source</th>
                    <th>Stage & Status</th>
                    <th style={{ textAlign: 'right', minWidth: 260 }}>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((app) => {
                    const isRejected = app.status === 'Rejected' || app.stage === 'Rejected'
                    const isOnHold = app.status === 'On Hold' || app.stage === 'On Hold'
                    const isApproved = !isRejected && !isOnHold && app.stage && app.stage !== 'Applied'
                    const isHovered = hoveredId === app.id

                    return (
                      <tr key={app.id} 
                        onClick={() => nav(`/app/applications/${app.id}`)} 
                        onMouseEnter={() => setHoveredId(app.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{ cursor: 'pointer', background: isHovered ? 'var(--surface-2)' : 'transparent', transition: 'background 0.15s ease' }}>
                        <td>
                          <div className="flex">
                            <Avatar name={app.candidate_name || '—'} src={app.candidate_image} size={32} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{app.candidate_name || '—'}</div>
                              <div className="muted" style={{ fontSize: 12 }}>{app.candidate_email || app.candidate_phone || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{app.job_title || 'General Application'}</div>
                          {app.company && <div className="muted" style={{ fontSize: 11 }}>{app.company}</div>}
                        </td>
                        <td>
                          <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
                            {app.match_score != null && (
                              <Badge variant={app.match_score >= 61 ? 'badge-green' : app.match_score >= 41 ? 'badge-amber' : app.match_score >= 21 ? 'badge-blue' : 'badge-red'}>
                                {app.match_score}% Match
                              </Badge>
                            )}
                            <Badge variant={
                              ['Highly Preferable', 'Preferable', 'Eligible'].includes(app.eligibility_status) ? 'badge-green' :
                              ['Considerable', 'Needs Review'].includes(app.eligibility_status) ? 'badge-amber' :
                              ['Relevant'].includes(app.eligibility_status) ? 'badge-blue' : 'badge-red'
                            }>
                              {app.eligibility_status || 'Checking...'}
                            </Badge>
                          </div>
                        </td>
                        <td><Badge variant="badge-gray">{app.source}</Badge></td>
                        <td>
                          <div className="stack" style={{ gap: 2 }}>
                            <Badge variant={isRejected ? 'badge-red' : isOnHold ? 'badge-amber' : 'badge-blue'}>
                              {app.stage || app.status}
                            </Badge>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                          <div className="flex" style={{ gap: 6, justifyContent: 'flex-end', opacity: isHovered || isRejected || isOnHold || isApproved ? 1 : 0.6, transition: 'opacity 0.2s ease' }}>
                            {isRejected ? (
                              <button
                                className="btn-soft btn-sm"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                disabled={(app.undo_count || 0) >= 5 || actionLoading[app.id]}
                                onClick={(e) => handleStageAction(app, 'undo_reject', e)}
                                title={`Restore application from rejection (${5 - (app.undo_count || 0)} undos left)`}
                              >
                                <RotateCcw size={13} />
                                {(app.undo_count || 0) >= 5 ? 'Max Undos' : `Undo Reject (${app.undo_count || 0}/5)`}
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn-soft btn-sm"
                                  style={{ 
                                    background: (isApproved || app.stage === 'Joined') ? 'var(--green-50)' : 'transparent', 
                                    color: (isApproved || app.stage === 'Joined') ? 'var(--green-700)' : 'var(--text-2)', 
                                    border: (isApproved || app.stage === 'Joined') ? '1px solid var(--green-300)' : '1px solid var(--border)', 
                                    padding: '5px 8px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 4,
                                    cursor: app.stage === 'Joined' ? 'not-allowed' : 'pointer'
                                  }}
                                  disabled={actionLoading[app.id] || app.stage === 'Joined'}
                                  onClick={(e) => handleStageAction(app, 'approve', e)}
                                  title={app.stage === 'Joined' ? 'Candidate Joined' : 'Approve & Move to Shortlisted'}
                                >
                                  <CheckCircle2 size={14} style={{ color: 'var(--green-600)' }} /> Approve
                                </button>
                                <button
                                  className="btn-soft btn-sm"
                                  style={{ 
                                    background: isOnHold ? 'var(--amber-50)' : 'transparent', 
                                    color: isOnHold ? 'var(--amber-700)' : 'var(--text-2)', 
                                    border: isOnHold ? '1px solid var(--amber-300)' : '1px solid var(--border)', 
                                    padding: '5px 8px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 4,
                                    opacity: app.stage === 'Joined' ? 0.4 : 1,
                                    cursor: app.stage === 'Joined' ? 'not-allowed' : 'pointer'
                                  }}
                                  disabled={actionLoading[app.id] || app.stage === 'Joined'}
                                  onClick={(e) => handleStageAction(app, 'on_hold', e)}
                                  title="Put application On Hold"
                                >
                                  <PauseCircle size={14} style={{ color: '#f59e0b' }} /> On Hold
                                </button>
                                <button
                                  className="btn-soft btn-sm"
                                  style={{ 
                                    background: 'transparent', 
                                    color: '#dc2626', 
                                    border: '1px solid var(--border)', 
                                    padding: '5px 8px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 4,
                                    opacity: app.stage === 'Joined' ? 0.4 : 1,
                                    cursor: app.stage === 'Joined' ? 'not-allowed' : 'pointer'
                                  }}
                                  disabled={actionLoading[app.id] || app.stage === 'Joined'}
                                  onClick={(e) => handleStageAction(app, 'reject', e)}
                                  title="Reject application"
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} perPage={data.per_page} total={data.total} onPage={setPage} />
          </>
        )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { UserRoundCheck, Download, Search, FileText, CalendarPlus, Award, Briefcase, X, ArrowRight, CheckCircle2, Clock, Undo2, UserCheck, ShieldCheck } from 'lucide-react'
import api, { baseURL, apiGet, apiPost } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, StatCard, Badge, Avatar, Pagination, Modal } from '../../components/UI'
import { CredentialsModal } from '../../components/CredentialsModal'
import { useToast } from '../../contexts/ToastContext'
import { fmtDate } from '../../utils/helpers'

export default function Joined() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [filters, setFilters] = useState({ search: '', job_id: '', college_id: '', source: '', page: 1 })
  const [exporting, setExporting] = useState(false)
  
  // Master-Detail right side panel / mobile modal state
  const [selectedAid, setSelectedAid] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [mobileModal, setMobileModal] = useState(false)

  // Credentials Modal State
  const [credentials, setCredentials] = useState(null)
  const [showCreds, setShowCreds] = useState(false)
  const [busyAid, setBusyAid] = useState(null)
  
  const toast = useToast()
  
  const { data: jobsData } = useFetch('/jds')
  const { data: collegeData } = useFetch('/admin/colleges')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const qs = new URLSearchParams()
      if (filters.search) qs.set('search', filters.search)
      if (filters.job_id) qs.set('job_id', filters.job_id)
      if (filters.college_id) qs.set('college_id', filters.college_id)
      if (filters.source) qs.set('source', filters.source)
      qs.set('page', filters.page)
      
      const resData = await apiGet(`/joined?${qs.toString()}`)
      setData(resData)
      
      // Auto-select first candidate if none is selected
      if (!selectedAid && resData?.items?.length > 0) {
        openProfile(resData.items[0].application_id)
      } else if (resData?.items?.length === 0) {
        setSelectedAid(null)
        setProfile(null)
      }
    } catch (e) { 
      setError(e.message || 'Failed to load joined candidates') 
    } finally { 
      setLoading(false) 
    }
  }, [filters])

  useEffect(() => { load() }, [load])
  
  const setF = (k, v) => setFilters(prev => ({ ...prev, [k]: v, page: k === 'page' ? v : 1 }))

  const exportCsv = async () => {
    setExporting(true)
    try {
      const qs = new URLSearchParams()
      if (filters.search) qs.set('search', filters.search)
      if (filters.job_id) qs.set('job_id', filters.job_id)
      if (filters.college_id) qs.set('college_id', filters.college_id)
      if (filters.source) qs.set('source', filters.source)
      
      const res = await api.get(`/joined/export.csv?${qs.toString()}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `joined_candidates_${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded successfully')
    } catch (e) {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const openProfile = async (aid) => {
    setSelectedAid(aid)
    setProfileLoading(true)
    if (window.innerWidth <= 1024) {
      setMobileModal(true)
    }
    try {
      const resData = await apiGet(`/joined/${aid}`)
      setProfile(resData)
    } catch (e) {
      toast.error(e.message || 'Failed to load profile details')
    } finally {
      setProfileLoading(false)
    }
  }

  const convertToEmployee = async (aid) => {
    setBusyAid(aid)
    try {
      const res = await apiPost(`/employees/from-candidate/${aid}`)
      toast.success(res.message || 'Candidate converted to Employee successfully!')
      if (res.data?.credentials || res.credentials) {
        setCredentials(res.data?.credentials || res.credentials)
        setShowCreds(true)
      }
      load()
      if (selectedAid === aid) {
        openProfile(aid)
      }
    } catch (e) {
      toast.error(e.message || 'Failed to create employee record')
    } finally {
      setBusyAid(null)
    }
  }

  const undoConversion = async (aid) => {
    setBusyAid(aid)
    try {
      const res = await apiPost(`/employees/undo-conversion/${aid}`)
      toast.success(res.message || 'Conversion undone successfully!')
      load()
      if (selectedAid === aid) {
        openProfile(aid)
      }
    } catch (e) {
      toast.error(e.message || 'Failed to undo conversion')
    } finally {
      setBusyAid(null)
    }
  }

  if (loading && !data) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={load} />

  const stats = data?.stats || { total_joined: 0, by_source: {}, by_department: {} }
  const topSource = Object.entries(stats.by_source).sort((a,b) => b[1] - a[1])[0]
  const depts = Object.keys(stats.by_department).length

  const renderProfileBody = () => {
    if (profileLoading || !profile) {
      return (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <LoadingSpinner label="Loading candidate profile..." />
        </div>
      )
    }

    const isEmp = profile.is_employee
    const remainingUndos = profile.remaining_conversion_undos ?? 3
    const canUndo = isEmp && remainingUndos > 0

    return (
      <div className="stack" style={{ gap: 24 }}>
        {/* Panel Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="flex" style={{ gap: 16, alignItems: 'center' }}>
            <Avatar name={profile.candidate.name} src={profile.candidate.profile_image} size={64} style={{ fontSize: 24 }} />
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{profile.candidate.name}</h2>
              <div className="muted mt-1" style={{ fontSize: 13 }}>{profile.candidate.email}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{profile.candidate.phone}</div>
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={() => { setSelectedAid(null); setProfile(null); setMobileModal(false); }}
            title="Close Profile View"
            style={{ padding: 6, borderRadius: 8 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Badges row */}
        <div className="flex wrap" style={{ gap: 8 }}>
          <Badge variant="badge-blue" style={{ fontSize: 12, padding: '4px 12px' }}>Source: {profile.source}</Badge>
          {profile.match_score != null && (
            <Badge variant="badge-green" style={{ fontSize: 12, padding: '4px 12px' }}>{profile.match_score}% Match Score</Badge>
          )}
          {isEmp && (
            <Badge variant="badge-violet" style={{ fontSize: 12, padding: '4px 12px' }}>
              Employee Code: {profile.employee_code || 'Active'}
            </Badge>
          )}
        </div>
        
        {/* Quick Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div className="muted mb-1" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Applied Role & Department</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)' }}>{profile.job?.title || 'General Application'}</div>
            <div className="muted mt-1" style={{ fontSize: 13 }}>{profile.job?.company} {profile.job?.department ? `• ${profile.job.department}` : ''}</div>
            <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} /> Joined on {fmtDate(profile.joined_at)}
            </div>
          </div>

          {/* Action Buttons: Convert / Undo */}
          {isEmp ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                padding: '12px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9', fontWeight: 700, fontSize: 13.5 }}>
                  <UserCheck size={18} />
                  <span>Employee Record Created</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 20 }}>
                  {remainingUndos}/3 Undos Left
                </span>
              </div>
              {canUndo && (
                <button
                  className="btn-danger btn-block flex"
                  style={{ gap: 6, justifyContent: 'center', padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}
                  disabled={busyAid === profile.application_id}
                  onClick={() => undoConversion(profile.application_id)}
                >
                  <Undo2 size={16} /> <span>Undo Conversion ({remainingUndos} left)</span>
                </button>
              )}
            </div>
          ) : (
            <button
              className="btn-primary btn-block flex"
              style={{ gap: 8, justifyContent: 'center', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 13.5 }}
              disabled={busyAid === profile.application_id}
              onClick={() => convertToEmployee(profile.application_id)}
            >
              <UserCheck size={18} />
              <span>Convert to Employee Record</span>
            </button>
          )}

          <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div className="muted mb-1" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Academic Background</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{profile.candidate.college_name || 'No college listed'}</div>
            <div className="muted mt-1" style={{ fontSize: 13 }}>
              {profile.candidate.degree || 'Degree unspecified'} {profile.candidate.branch ? `(${profile.candidate.branch})` : ''}
            </div>
            {profile.candidate.graduation_year && (
              <div className="muted mt-1" style={{ fontSize: 12 }}>Class of {profile.candidate.graduation_year}</div>
            )}
          </div>
        </div>

        {/* Skills Chips */}
        {profile.candidate.skills?.length > 0 && (
          <div>
            <h4 className="mb-2" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)' }}>Skills & Expertise</h4>
            <div className="flex wrap" style={{ gap: 6 }}>
              {profile.candidate.skills.map(s => (
                <span key={s} style={{ 
                  padding: '4px 10px', background: 'var(--brand-50)', color: 'var(--brand-700)', 
                  borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--brand-100)' 
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resume Action */}
        {profile.candidate.resume_file ? (
          <a 
            className="btn-soft btn-block flex" 
            href={`${baseURL}/files/${profile.candidate.resume_file}?token=${localStorage.getItem('hr_token')}`} 
            target="_blank" 
            rel="noreferrer" 
            style={{ justifyContent: 'center', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 13.5 }}
          >
            <FileText size={17} style={{ marginRight: 8 }} /> Open Resume Document
          </a>
        ) : (
          <div className="muted text-center" style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, fontSize: 13 }}>No resume on file</div>
        )}

        {/* Stage History Timeline */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 className="mb-4" style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)' }}>Stage Progression</h4>
          <div style={{ position: 'relative', paddingLeft: 6 }}>
            <div style={{ position: 'absolute', left: 11, top: 8, bottom: 16, width: 2, background: 'var(--border)' }} />
            {profile.history.map((h, i) => {
              const isLatest = i === profile.history.length - 1
              return (
                <div key={h.id} className="mb-4" style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ 
                    position: 'absolute', left: 0, top: 3, width: 12, height: 12, borderRadius: '50%', 
                    background: isLatest ? 'var(--green-500)' : 'var(--brand-400)', 
                    border: '2px solid var(--surface)',
                    boxShadow: isLatest ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none'
                  }} />
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: isLatest ? 'var(--text)' : 'var(--text-2)' }}>
                    {h.from_stage ? `${h.from_stage} → ` : ''}{h.to_stage}
                  </div>
                  <div className="muted mt-1" style={{ fontSize: 11.5 }}>
                    By {h.by} • {fmtDate(h.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title="Joined Candidates" 
        subtitle="Everyone who accepted and joined your organization." 
        icon={UserRoundCheck} 
        actions={
          <button className="btn-primary" onClick={exportCsv} disabled={exporting || stats.total_joined === 0}>
            <Download size={16} style={{ marginRight: 6 }} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        }
      />

      {/* Credentials Modal Popup */}
      <CredentialsModal
        open={showCreds}
        onClose={() => setShowCreds(false)}
        credentials={credentials}
      />

      {/* Mobile Candidate Details Popup Modal */}
      <Modal
        open={mobileModal}
        onClose={() => setMobileModal(false)}
        title="Candidate Joined Profile"
        width={560}
      >
        {renderProfileBody()}
      </Modal>

      {/* Sleek Stats Row */}
      <div className="grid-stats mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard 
          icon={UserRoundCheck}
          label="Total Joined" 
          value={stats.total_joined} 
          sub="All-time joined candidates"
          tone="green"
        />
        <StatCard 
          icon={Award}
          label="Top Source" 
          value={topSource ? topSource[0] : 'N/A'} 
          sub={topSource ? `${topSource[1]} candidate(s)` : 'No source data yet'}
          tone="brand"
        />
        <StatCard 
          icon={Briefcase}
          label="Active Departments" 
          value={depts} 
          sub="Departments with joined talent"
          tone="amber"
        />
      </div>

      {/* Filter Bar */}
      <div className="card mb-6 flex wrap" style={{ gap: 12, padding: '16px 20px', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} className="muted" style={{ position: 'absolute', left: 14, top: 11 }} />
          <input className="input" placeholder="Search name or email..." value={filters.search}
            onChange={(e) => setF('search', e.target.value)} style={{ paddingLeft: 38, width: '100%' }} />
        </div>
        <select className="select" value={filters.job_id} onChange={(e) => setF('job_id', e.target.value)} style={{ width: 170 }}>
          <option value="">All Jobs</option>
          {(jobsData?.items || []).map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select className="select" value={filters.college_id} onChange={(e) => setF('college_id', e.target.value)} style={{ width: 170 }}>
          <option value="">All Colleges</option>
          {(collegeData?.items || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select" value={filters.source} onChange={(e) => setF('source', e.target.value)} style={{ width: 150 }}>
          <option value="">All Sources</option>
          <option value="CAREERS">Careers</option>
          <option value="COLLEGE">College</option>
          <option value="DIRECT">Direct</option>
          <option value="REFERRAL">Referral</option>
        </select>
      </div>

      {data?.items?.length === 0 ? (
        <EmptyState icon={UserRoundCheck} title="No joined candidates found" message="Candidates appear here once they accept their offer and reach the Joined stage." />
      ) : (
        /* Master-Detail Split Grid: Table on left, Profile Side View on right */
        <div style={{ display: 'grid', gridTemplateColumns: selectedAid ? 'minmax(0, 1fr) 420px' : '1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Column: Candidates Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
            <table className="data" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <th style={{ padding: '14px 20px' }}>Candidate</th>
                  <th style={{ padding: '14px 16px' }}>College & Branch</th>
                  <th style={{ padding: '14px 16px' }}>Role</th>
                  <th style={{ padding: '14px 16px' }}>Status / Action</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(c => {
                  const isSelected = selectedAid === c.application_id
                  const isEmp = c.is_employee
                  const remainingUndos = c.remaining_conversion_undos ?? 3
                  return (
                    <tr 
                      key={c.application_id} 
                      onClick={() => openProfile(c.application_id)} 
                      style={{ 
                        cursor: 'pointer',
                        background: isSelected ? 'var(--brand-50)' : 'transparent',
                        borderLeft: isSelected ? '4px solid var(--brand-600)' : '4px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
                          <Avatar name={c.name} src={c.profile_image} size={42} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? 'var(--brand-700)' : 'var(--text)' }}>{c.name}</div>
                            <div className="muted" style={{ fontSize: 12.5 }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.college_name || '—'}</div>
                        <div className="muted" style={{ fontSize: 12.5 }}>{c.branch || '—'}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.job_title}</div>
                        <div className="muted" style={{ fontSize: 12.5 }}>{c.department || c.company}</div>
                      </td>
                      <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                        {isEmp ? (
                          <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
                            <Badge variant="badge-violet" style={{ fontSize: 11 }}>Employee</Badge>
                            {remainingUndos > 0 && (
                              <button
                                className="btn-ghost btn-sm flex"
                                style={{ padding: '2px 8px', fontSize: 11, gap: 3, color: 'var(--red-600)' }}
                                title={`Undo conversion (${remainingUndos} undos left)`}
                                disabled={busyAid === c.application_id}
                                onClick={() => undoConversion(c.application_id)}
                              >
                                <Undo2 size={12} /> <span>Undo ({remainingUndos})</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            className="btn-soft btn-sm flex"
                            style={{ gap: 4, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}
                            disabled={busyAid === c.application_id}
                            onClick={() => convertToEmployee(c.application_id)}
                          >
                            <UserCheck size={14} /> <span>Convert</span>
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, fontSize: 13, color: 'var(--text-2)' }}>
                        {c.joined_at ? fmtDate(c.joined_at) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding: '4px 16px', borderTop: '1px solid var(--border)' }}>
              <Pagination page={data.page} total={data.total} perPage={data.per_page} onPage={(p) => setF('page', p)} />
            </div>
          </div>

          {/* Right Column: Profile Side Panel (Desktop only) */}
          {selectedAid && (
            <div className="card desktop-only" style={{ padding: '24px', position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
              {renderProfileBody()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

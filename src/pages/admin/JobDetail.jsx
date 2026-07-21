import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Globe, Building2, FileText, Upload, 
  MapPin, CheckCircle2, AlertCircle, BookOpen, GraduationCap, 
  Briefcase, Percent, Award, Download, MessageSquare
} from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, PageHeader, Modal, Badge, EmptyState } from '../../components/UI'
import { apiPost, baseURL } from '../../api/client'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

export default function JobDetail() {
  const { jid } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { hasRole } = useAuth()
  const { data: job, loading, error, refetch } = useFetch(`/jds/${jid}`)
  const { data: collegeData } = useFetch('/admin/colleges')
  const [assignModal, setAssignModal] = useState(false)
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)

  const colleges = collegeData?.items || []

  const publish = async (careers) => {
    try { await apiPost(`/jds/${jid}/publish`, { careers }); toast.success('Updated'); refetch() }
    catch (e) { toast.error(e.message) }
  }
  
  const uploadJd = async (file) => {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      await api.post(`/jds/${jid}/jd-document`, fd, { headers: { 'Content-Type': undefined } })
      toast.success('JD uploaded'); refetch()
    } catch (e) { toast.error(e.message) }
  }
  
  const assign = async () => {
    if (selected.length === 0) return toast.error('Select at least one college')
    setBusy(true)
    try {
      await apiPost(`/jds/${jid}/assign`, { college_ids: selected })
      toast.success('Assigned successfully'); setAssignModal(false); setSelected([]); refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const [notifyModal, setNotifyModal] = useState(null)
  const [notifyMsg, setNotifyMsg] = useState('')
  const sendNotify = async () => {
    if (!notifyMsg.trim()) return toast.error('Message is required')
    setBusy(true)
    try {
      const res = await apiPost(`/admin/colleges/${notifyModal.id}/notify`, { message: notifyMsg, job_id: jid })
      toast.success(`Sent to ${res.sent_count} officers!`)
      setNotifyModal(null); setNotifyMsg('')
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const assignedIds = job.assigned_colleges || []
  const available = colleges.filter((c) => !assignedIds.includes(c.id))

  return (
    <div className="fade-in">
      <button 
        className="flex muted mb-4" 
        style={{ gap: 6, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.2s' }} 
        onClick={() => nav('/app/jobs')}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <ArrowLeft size={16} /> Back to all jobs
      </button>

      <PageHeader 
        title={job.title} 
        subtitle={
          <div className="flex wrap" style={{ gap: 12, marginTop: 8 }}>
            <span className="flex" style={{ gap: 6, color: 'var(--text-2)', fontWeight: 500 }}>
              <Building2 size={15} /> {job.company || 'Company not set'}
            </span>
            <span className="flex" style={{ gap: 6, color: 'var(--text-2)', fontWeight: 500 }}>
              <MapPin size={15} /> {job.location || 'Location unspecified'}
            </span>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
            <Badge variant={job.status === 'Published' ? 'badge-green' : 'badge-gray'} dot>{job.status}</Badge>
            {job.published_to_careers && <Badge variant="badge-violet">Live on Careers Portal</Badge>}
          </div>
        }
        icon={Briefcase}
        actions={hasRole('ADMIN') && (
          <div className="flex wrap" style={{ gap: 12, marginTop: 4 }}>
            <button className="btn-soft flex" style={{ padding: '9px 16px', fontWeight: 600, gap: 8, whiteSpace: 'nowrap' }} onClick={() => publish(!job.published_to_careers)}>
              <Globe size={16} style={{ color: job.published_to_careers ? 'var(--red-500)' : 'var(--blue-500)' }} /> 
              {job.published_to_careers ? 'Unpublish from Careers' : 'Publish to Careers'}
            </button>
            <button className="btn-primary flex" style={{ padding: '9px 16px', fontWeight: 600, gap: 8, whiteSpace: 'nowrap' }} onClick={() => setAssignModal(true)}>
              <Building2 size={16} /> Assign to Colleges
            </button>
          </div>
        )} 
      />

      <div className="two-col mt-4">
        <div className="stack" style={{ gap: 24 }}>
          {/* Job Description Card */}
          <div className="card card-pad">
            <h3 className="h2 mb-4">Job Description</h3>
            {job.description ? (
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-2)', lineHeight: 1.7, fontSize: 15 }}>
                {job.description}
              </p>
            ) : (
              <p className="muted">No detailed description provided.</p>
            )}

            <div className="divider" style={{ margin: '28px 0' }} />
            
            <h3 className="h2 mb-4" style={{ fontSize: 16 }}>Required Skills</h3>
            <div className="flex wrap" style={{ gap: 8 }}>
              {(job.required_skills || []).length > 0 
                ? job.required_skills.map((s) => <span key={s} className="chip">{s}</span>) 
                : <span className="muted">No mandatory skills listed</span>}
            </div>

            {job.preferred_skills?.length > 0 && (
              <>
                <h3 className="h2 mb-4 mt-6" style={{ fontSize: 16 }}>Preferred Skills</h3>
                <div className="flex wrap" style={{ gap: 8 }}>
                  {job.preferred_skills.map((s) => <span key={s} className="chip chip-gray">{s}</span>)}
                </div>
              </>
            )}
          </div>

          {/* Assigned Colleges Card */}
          <div className="card">
            <div className="card-head">
              <h2>Campus Drives & Assignments</h2>
              <Badge variant="badge-blue">{job.application_count} total applications</Badge>
            </div>
            
            {(job.assignments || []).length === 0 ? (
              <EmptyState icon={Building2} title="No Colleges Assigned" message="Assign this job to partner colleges to start receiving student applications." />
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>College Name</th>
                    <th>Assignment Date</th>
                    <th>Applications</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {job.assignments.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{a.college_name}</td>
                      <td className="muted">{new Date(a.assigned_at).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: 12.5 }}>
                          {a.students_submitted} students
                        </span>
                      </td>
                      <td>
                        <button className="btn-ghost btn-sm flex" onClick={() => { setNotifyModal({ id: a.college_id, name: a.college_name }); setNotifyMsg('') }}>
                          <MessageSquare size={14} /> Notify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="stack" style={{ gap: 24 }}>
          {/* Eligibility Rules */}
          <div className="card card-pad">
            <div className="flex mb-4" style={{ gap: 12, alignItems: 'center' }}>
              <div style={{ padding: 8, background: 'var(--amber-50)', color: 'var(--amber-700)', borderRadius: 10 }}>
                <CheckCircle2 size={20} />
              </div>
              <h3 className="h2" style={{ fontSize: 18 }}>Eligibility Rules</h3>
            </div>
            
            <div className="stack" style={{ gap: 12, marginTop: 24 }}>
              <Rule icon={BookOpen} label="Allowed Branches" value={(job.allowed_branches || []).join(', ')} />
              <Rule icon={GraduationCap} label="Graduation Year" value={(job.allowed_grad_years || []).join(', ')} />
              <Rule label="Required Degree" value={job.required_degree} />
              <Rule icon={Award} label="Minimum CGPA" value={job.min_cgpa ? `${job.min_cgpa} CGPA` : null} />
              <Rule icon={Percent} label="Min 10th Score" value={job.min_tenth ? `${job.min_tenth}%` : null} />
              <Rule icon={Percent} label="Min 12th Score" value={job.min_twelfth ? `${job.min_twelfth}%` : null} />
              <Rule icon={AlertCircle} label="Max Backlogs" value={job.max_backlogs} />
            </div>
          </div>

          {/* JD Document */}
          {hasRole('ADMIN') && (
            <div className="card card-pad">
              <div className="flex mb-4" style={{ gap: 12, alignItems: 'center' }}>
                <div style={{ padding: 8, background: 'var(--blue-50)', color: 'var(--blue-700)', borderRadius: 10 }}>
                  <FileText size={20} />
                </div>
                <h3 className="h2" style={{ fontSize: 18 }}>Official Document</h3>
              </div>
              
              {job.jd_document ? (
                <div style={{ padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="flex" style={{ gap: 14, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--brand-50)', color: 'var(--brand-600)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.jd_document.split('/').pop() || 'Document.pdf'}
                      </div>
                      <div className="muted" style={{ fontSize: 12.5 }}>Attached JD File</div>
                    </div>
                  </div>
                  <a href={`${baseURL}/files/${job.jd_document}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" style={{ padding: 8, borderRadius: 8 }}>
                    <Download size={16} />
                  </a>
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', background: 'var(--surface-2)', border: '1px dashed var(--border-2)', borderRadius: 12 }}>
                  <p className="muted mb-2">No official document attached</p>
                </div>
              )}
              
              <label className="btn-soft btn-block mt-4" style={{ cursor: 'pointer', padding: '12px' }}>
                <Upload size={16} /> {job.jd_document ? 'Replace Document' : 'Upload PDF/DOCX'}
                <input type="file" hidden accept=".pdf,.txt,.doc,.docx" onChange={(e) => uploadJd(e.target.files[0])} />
              </label>
            </div>
          )}
        </div>
      </div>

      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Job to Partner Colleges"
        footer={<><button className="btn-ghost" onClick={() => setAssignModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={assign} disabled={busy}>{busy ? 'Assigning…' : `Assign to ${selected.length} colleges`}</button></>}>
        {available.length === 0 ? <p className="muted" style={{ padding: 20, textAlign: 'center' }}>All colleges are already assigned, or no partner colleges exist.</p> : (
          <div className="stack" style={{ gap: 10 }}>
            {available.map((c) => (
              <label key={c.id} className="flex" style={{ 
                padding: '12px 16px', border: selected.includes(c.id) ? '1px solid var(--brand-500)' : '1px solid var(--border)', 
                background: selected.includes(c.id) ? 'var(--brand-50)' : 'var(--surface)',
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' 
              }}>
                <input type="checkbox" checked={selected.includes(c.id)}
                  onChange={(e) => setSelected(e.target.checked ? [...selected, c.id] : selected.filter((x) => x !== c.id))} 
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-500)' }}
                />
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <Badge variant="badge-gray" style={{ marginLeft: 'auto' }}>{c.student_count} students</Badge>
              </label>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={!!notifyModal} onClose={() => setNotifyModal(null)} title={`Message ${notifyModal?.name}`}
        footer={<><button className="btn-ghost" onClick={() => setNotifyModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={sendNotify} disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button></>}>
        <p className="muted mb-4" style={{ fontSize: 13.5 }}>This will notify the placement officer(s) with a direct link to this JD.</p>
        <div className="field">
          <label>Message *</label>
          <textarea className="input" rows={4} value={notifyMsg} onChange={(e) => setNotifyMsg(e.target.value)} placeholder="E.g. Please submit at least 50 students for this software engineering role before Friday." />
        </div>
      </Modal>
    </div>
  )
}

function Rule({ icon: Icon, label, value }) {
  const hasValue = value !== null && value !== undefined && value !== '' && value !== 0
  return (
    <div className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="flex" style={{ gap: 10, color: 'var(--text-2)' }}>
        {Icon ? <Icon size={16} style={{ color: 'var(--text-3)' }} /> : <div style={{ width: 16 }} />}
        <span style={{ fontSize: 13.5 }}>{label}</span>
      </div>
      <strong style={{ fontSize: 13.5, color: hasValue ? 'var(--text)' : 'var(--text-3)' }}>
        {hasValue ? String(value) : 'Any'}
      </strong>
    </div>
  )
}

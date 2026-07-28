import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Plus, Globe, Send, Pencil, Trash2 } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, StatCard, PageHeader, Modal, Badge } from '../../components/UI'
import { apiPost, apiPut, apiDelete } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { fmtDate } from '../../utils/helpers'

const BLANK = {
  title: '', company: '', department: '', location: '', employment_type: 'Full-time',
  ctc_min: '', ctc_max: '', experience_min: '', openings: 1, description: '',
  required_skills: '', preferred_skills: '', allowed_branches: '', allowed_grad_years: '',
  required_degree: '', min_cgpa: '', min_tenth: '', min_twelfth: '', max_backlogs: '', deadline: '',
}

export default function Jobs() {
  const { data, loading, error, refetch } = useFetch('/jds')
  const { hasRole } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const saveJob = async () => {
    if (!form.title.trim()) return toast.error('Job title is required')
    setBusy(true)
    try {
      const payload = {
        ...form,
        required_skills: typeof form.required_skills === 'string' ? splitList(form.required_skills) : form.required_skills,
        preferred_skills: typeof form.preferred_skills === 'string' ? splitList(form.preferred_skills) : form.preferred_skills,
        allowed_branches: typeof form.allowed_branches === 'string' ? splitList(form.allowed_branches) : form.allowed_branches,
        allowed_grad_years: typeof form.allowed_grad_years === 'string' ? splitList(form.allowed_grad_years) : form.allowed_grad_years,
      }
      
      let job;
      if (editId) {
        job = await apiPut(`/jds/${editId}`, payload)
        toast.success('Job updated')
        refetch()
        setModal(false)
      } else {
        job = await apiPost('/jds', payload)
        toast.success('Job created')
        setModal(false)
        setForm(BLANK)
        nav(`/app/jobs/${job.id}`)
      }
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this job?')) return
    try {
      await apiDelete(`/jds/${id}`)
      toast.success('Job deleted')
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleEdit = (e, job) => {
    e.stopPropagation()
    setForm({
      ...job,
      ctc_min: job.ctc_min ?? '',
      ctc_max: job.ctc_max ?? '',
      experience_min: job.experience_min ?? '',
      min_cgpa: job.min_cgpa ?? '',
      min_tenth: job.min_tenth ?? '',
      min_twelfth: job.min_twelfth ?? '',
      max_backlogs: job.max_backlogs ?? '',
      deadline: job.deadline ? job.deadline.substring(0, 10) : '',
      required_skills: (job.required_skills || []).join('; '),
      preferred_skills: (job.preferred_skills || []).join('; '),
      allowed_branches: (job.allowed_branches || []).join('; '),
      allowed_grad_years: (job.allowed_grad_years || []).join('; '),
    })
    setEditId(job.id)
    setModal(true)
  }

  const [originFilter, setOriginFilter] = useState('ALL')

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const stats = data?.stats || {}
  const rawItems = data?.items || []

  const filteredItems = rawItems.filter(j => {
    if (originFilter === 'ADMIN') return !j.hiring_request_id
    if (originFilter === 'MANAGER') return !!j.hiring_request_id
    return true
  })

  return (
    <div>
      <PageHeader title="Jobs / Job Descriptions (JDs)" subtitle="Manage standard JDs created by Admin and Custom JDs from Manager Requisitions." icon={Briefcase}
        actions={hasRole('ADMIN') && <button className="btn-primary" onClick={() => { setEditId(null); setForm(BLANK); setModal(true); }}><Plus size={16} /> Create JD</button>} />

      <div className="grid-stats mb-4">
        <StatCard icon={Briefcase} label="Total JDs" value={stats.total ?? 0} tone="brand" />
        <StatCard icon={Send} label="Admin Custom JDs" value={stats.admin_created ?? 0} tone="violet" />
        <StatCard icon={Briefcase} label="Manager Requisitions" value={stats.manager_requisitions ?? 0} tone="blue" />
        <StatCard icon={Globe} label="On Careers Portal" value={stats.on_careers ?? 0} tone="green" />
      </div>

      {/* Origin Filter Bar */}
      <div className="card mb-4 flex row-between" style={{ padding: '12px 18px', background: '#ffffff', borderRadius: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn-soft ${originFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setOriginFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: originFilter === 'ALL' ? 'var(--brand-500)' : '#f1f5f9',
              color: originFilter === 'ALL' ? '#ffffff' : 'var(--text-2)'
            }}
          >
            All JDs ({rawItems.length})
          </button>

          <button
            className={`btn-soft ${originFilter === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setOriginFilter('ADMIN')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: originFilter === 'ADMIN' ? '#8b5cf6' : '#f1f5f9',
              color: originFilter === 'ADMIN' ? '#ffffff' : 'var(--text-2)'
            }}
          >
            Admin Created ({stats.admin_created ?? 0})
          </button>

          <button
            className={`btn-soft ${originFilter === 'MANAGER' ? 'active' : ''}`}
            onClick={() => setOriginFilter('MANAGER')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: originFilter === 'MANAGER' ? '#0284c7' : '#f1f5f9',
              color: originFilter === 'MANAGER' ? '#ffffff' : 'var(--text-2)'
            }}
          >
            Manager Requisition Custom JDs ({stats.manager_requisitions ?? 0})
          </button>
        </div>

        <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Click any JD row to view full details or manage college assignments
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs matching filter" message="Create a new job description or adjust your search filter." />
      ) : (
        <div className="card" style={{ padding: 0, borderRadius: 14, overflow: 'hidden' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type / Origin</th>
                <th>Department & Manager</th>
                <th>Status</th>
                <th>Careers</th>
                <th>Applicants</th>
                <th>Colleges</th>
                {hasRole('ADMIN') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((j) => (
                <tr key={j.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/app/jobs/${j.id}`)}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{j.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{j.company || 'MPC Cloud Consulting'} • {j.employment_type || 'Full-time'}</div>
                  </td>
                  <td>
                    {j.is_manager_requisition ? (
                      <Badge variant="badge-blue">Manager Requisition</Badge>
                    ) : (
                      <Badge variant="badge-violet">Admin Custom JD</Badge>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{j.department_name || 'General'}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{j.manager_name ? `Mgr: ${j.manager_name}` : 'HR Team'}</div>
                  </td>
                  <td><Badge variant={j.status === 'Published' || j.status === 'Active' ? 'badge-green' : j.status === 'Closed' ? 'badge-red' : 'badge-gray'}>{j.status}</Badge></td>
                  <td>{j.published_to_careers ? <Badge variant="badge-violet">Live</Badge> : <span className="muted">—</span>}</td>
                  <td><strong style={{ color: '#0284c7' }}>{j.application_count}</strong></td>
                  <td><span className="muted">{j.assigned_colleges_count || 0} shared</span></td>
                  {hasRole('ADMIN') && (
                    <td>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-soft"
                          style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                          onClick={() => nav(`/app/pipeline?job_id=${j.id}`)}
                          title="View Recruitment Pipeline"
                        >
                          Pipeline
                        </button>
                        <button className="icon-btn" onClick={(e) => handleEdit(e, j)} title="Edit"><Pencil size={15} /></button>
                        <button className="icon-btn" style={{ color: 'var(--red-500)' }} onClick={(e) => handleDelete(e, j.id)} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Job Description" : "Create Job Description"} width={640}
        footer={<><button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={saveJob} disabled={busy}>{busy ? 'Saving…' : (editId ? 'Save Changes' : 'Create JD')}</button></>}>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 2 }}><label>Job title *</label><input className="input" value={form.title || ''} onChange={set('title')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Company</label><input className="input" value={form.company || ''} onChange={set('company')} /></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Department</label><input className="input" value={form.department || ''} onChange={set('department')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Location</label><input className="input" value={form.location || ''} onChange={set('location')} /></div>
          <div className="field" style={{ width: 130 }}><label>Type</label>
            <select className="select" value={form.employment_type || ''} onChange={set('employment_type')}>
              <option>Full-time</option><option>Internship</option><option>Contract</option></select></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>CTC min (LPA)</label><input className="input" type="number" value={form.ctc_min || ''} onChange={set('ctc_min')} /></div>
          <div className="field" style={{ flex: 1 }}><label>CTC max (LPA)</label><input className="input" type="number" value={form.ctc_max || ''} onChange={set('ctc_max')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Min experience (yrs)</label><input className="input" type="number" value={form.experience_min || ''} onChange={set('experience_min')} /></div>
          <div className="field" style={{ width: 100 }}><label>Openings</label><input className="input" type="number" value={form.openings || ''} onChange={set('openings')} /></div>
        </div>
        <div className="field"><label>Description</label><textarea className="input" rows={3} value={form.description || ''} onChange={set('description')} /></div>
        <div className="field"><label>Required skills (semicolon separated)</label><input className="input" value={form.required_skills || ''} onChange={set('required_skills')} placeholder="Python; SQL; React" /></div>
        <div className="field"><label>Preferred skills</label><input className="input" value={form.preferred_skills || ''} onChange={set('preferred_skills')} placeholder="Docker; AWS" /></div>

        <div className="divider" /><h4 className="mb-4">Eligibility rules (campus)</h4>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Allowed branches</label><input className="input" value={form.allowed_branches || ''} onChange={set('allowed_branches')} placeholder="Computer Science; IT" /></div>
          <div className="field" style={{ flex: 1 }}><label>Allowed grad years</label><input className="input" value={form.allowed_grad_years || ''} onChange={set('allowed_grad_years')} placeholder="2025; 2026" /></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Required degree</label><input className="input" value={form.required_degree || ''} onChange={set('required_degree')} placeholder="B.Tech" /></div>
          <div className="field" style={{ flex: 1 }}><label>Min CGPA</label><input className="input" type="number" step="0.1" min="0" max="10" value={form.min_cgpa || ''} onChange={set('min_cgpa')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Max backlogs</label><input className="input" type="number" value={form.max_backlogs || ''} onChange={set('max_backlogs')} /></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Min 10th %</label><input className="input" type="number" step="0.1" min="0" max="100" value={form.min_tenth || ''} onChange={set('min_tenth')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Min 12th %</label><input className="input" type="number" step="0.1" min="0" max="100" value={form.min_twelfth || ''} onChange={set('min_twelfth')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Deadline</label><input className="input" type="date" value={form.deadline || ''} onChange={set('deadline')} /></div>
        </div>
      </Modal>
    </div>
  )
}

function splitList(s) {
  return (s || '').split(/[;,]/).map((x) => x.trim()).filter(Boolean)
}

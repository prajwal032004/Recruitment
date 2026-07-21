import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, FileCheck, FileX, CheckCircle2 } from 'lucide-react'
import { apiGet, apiPost, baseURL } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

export default function CollegeJobDetail() {
  const { slug, jid } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data, loading, error, refetch } = useFetch(`/college/${slug}/jds/${jid}`, [slug, jid])
  const { data: studentData } = useFetch(`/college/${slug}/students?per_page=100`, [slug])
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const job = data?.job || {}
  const submittedIds = data?.submitted_student_ids || []
  const students = studentData?.items || []

  const submit = async () => {
    if (selected.length === 0) return toast.error('Select students to submit')
    setBusy(true)
    try {
      const res = await apiPost(`/college/${slug}/jds/${jid}/submit`, { student_ids: selected })
      toast.success(res.message || 'Submitted'); setSelected([]); refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const selectableStudents = students.filter(s => !submittedIds.includes(s.id))
  const allSelected = selectableStudents.length > 0 && selected.length === selectableStudents.length

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(selectableStudents.map(s => s.id))
    else setSelected([])
  }

  return (
    <div>
      <button className="btn-ghost btn-sm mb-4" onClick={() => nav(`/${slug}`)}><ArrowLeft size={15} /> Opportunities</button>
      <PageHeader title={job.title} subtitle={`${job.company || '—'} · ${job.location || '—'}`}
        actions={<button className="btn-primary" onClick={submit} disabled={busy}><Send size={15} /> Submit Selected ({selected.length})</button>} />

      <div className="two-col">
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <h2 style={{ margin: 0 }}>Eligible Students</h2>
            <span className="muted" style={{ fontSize: 13 }}>{students.length} in pool</span>
          </div>
          {students.length === 0 ? (
            <EmptyState icon={FileX} title="No students yet" message="Add students in the Students tab first." />
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={selectableStudents.length === 0} /></th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Resume</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const done = submittedIds.includes(s.id)
                  return (
                    <tr key={s.id} style={{ background: selected.includes(s.id) ? 'var(--brand-50)' : 'transparent' }}>
                      <td><input type="checkbox" disabled={done} checked={selected.includes(s.id)}
                        onChange={(e) => setSelected(e.target.checked ? [...selected, s.id] : selected.filter((x) => x !== s.id))} /></td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.branch || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{s.cgpa ?? '—'}</td>
                      <td>{s.has_resume ? <FileCheck size={18} color="var(--green-600)" /> : <FileX size={18} color="var(--red-400)" />}</td>
                      <td>{done ? <Badge variant="badge-green">Submitted</Badge> : <span className="muted">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card card-pad" style={{ alignSelf: 'start' }}>
          <h2 style={{ marginBottom: 16, fontSize: 16 }}>Eligibility Criteria</h2>
          <div className="stack" style={{ gap: 0 }}>
            <Row label="Branches" value={(job.allowed_branches || []).join(', ')} />
            <Row label="Grad years" value={(job.allowed_grad_years || []).join(', ')} />
            <Row label="Degree" value={job.required_degree} />
            <Row label="Min CGPA" value={job.min_cgpa} />
            <Row label="Min 10th %" value={job.min_tenth} />
            <Row label="Min 12th %" value={job.min_twelfth} />
            <Row label="Max backlogs" value={job.max_backlogs} />
          </div>
          {job.jd_document && <a className="btn-soft btn-sm btn-block mt-4" href={`${baseURL}/files/${job.jd_document}`} target="_blank" rel="noreferrer">View JD document</a>}
          {job.required_skills?.length > 0 && <>
            <h4 className="mt-4">Required skills</h4>
            <div className="flex wrap mt-2" style={{ gap: 6 }}>{job.required_skills.map((s) => <span key={s} className="chip">{s}</span>)}</div></>}
          <p className="muted mt-4" style={{ fontSize: 12 }}>Eligibility is auto-screened when students are submitted. HR sees the results in the pipeline.</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 16 }}>
      <span className="muted" style={{ flexShrink: 0, marginTop: 1 }}>{label}</span>
      <strong style={{ textAlign: 'right', wordBreak: 'break-word', lineHeight: 1.4, color: 'var(--text)' }}>
        {value !== null && value !== undefined && value !== '' ? String(value) : 'Any'}
      </strong>
    </div>
  )
}

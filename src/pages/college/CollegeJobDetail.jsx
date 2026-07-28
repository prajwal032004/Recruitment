import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, FileCheck, FileX, CheckCircle2, Eye, Users } from 'lucide-react'
import { apiGet, apiPost, baseURL } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge, Modal } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

export default function CollegeJobDetail() {
  const { slug, jid } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data, loading, error, refetch } = useFetch(`/college/${slug}/jds/${jid}`, [slug, jid])
  const { data: studentData } = useFetch(`/college/${slug}/students?per_page=100`, [slug])
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const job = data?.job || {}
  const submittedIds = data?.submitted_student_ids || []
  const submittedCandidates = data?.submitted_candidates || []
  const students = studentData?.items || []

  const openings = job.openings || 1
  const maxAllowed = data?.max_allowed || (openings + 3)
  const assignedCount = data?.assigned_count || submittedIds.length
  const remainingSeats = data?.remaining_seats ?? Math.max(0, maxAllowed - assignedCount)

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
      <PageHeader
        title={job.title}
        subtitle={`${job.company || '—'} · ${job.location || '—'}`}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {submittedCandidates.length > 0 && (
              <button className="btn-secondary" onClick={() => setViewModalOpen(true)}>
                <Eye size={15} /> View Candidates ({submittedCandidates.length})
              </button>
            )}
            <button className="btn-primary" onClick={submit} disabled={busy}>
              <Send size={15} /> Submit Selected ({selected.length})
            </button>
          </div>
        }
      />

      {/* Quota Banner */}
      <div style={{ background: '#f8fafc', padding: '14px 20px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
              Target Quota: {maxAllowed} Candidates ({openings} Openings + 3 Buffer)
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Submitted / Assigned: <strong>{assignedCount}</strong> • Remaining Available Seats: <strong style={{ color: remainingSeats > 0 ? '#0284c7' : '#059669' }}>{remainingSeats}</strong>
            </div>
          </div>
        </div>

        {remainingSeats > 0 && (
          <div style={{ background: '#f0f9ff', color: '#0369a1', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid #bae6fd' }}>
            {remainingSeats} Remaining Seats can be filled by Placement Officer or Admin
          </div>
        )}
      </div>

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

      {/* POP View Candidates Modal */}
      {viewModalOpen && (
        <Modal open={true} title={`Submitted Candidates — ${job.title}`} onClose={() => setViewModalOpen(false)} width={680}>
          <div style={{ marginBottom: 16, background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Submissions for {job.title}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Total Candidates: <strong>{submittedCandidates.length}</strong> of <strong>{maxAllowed} Max Capacity</strong> ({openings} Openings + 3 Buffer)
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {submittedCandidates.map(c => (
              <div key={c.application_id || c.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, background: '#ffffff' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{c.email} • {c.branch || '—'} {c.cgpa ? `• CGPA: ${c.cgpa}` : ''}</div>
                </div>
                <Badge variant="badge-green">{c.stage || 'Submitted'}</Badge>
              </div>
            ))}
          </div>

          <div className="row gap-8 justify-end mt-16">
            <button className="btn-primary" onClick={() => setViewModalOpen(false)}>Close</button>
          </div>
        </Modal>
      )}
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

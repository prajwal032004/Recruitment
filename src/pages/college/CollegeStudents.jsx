import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, Plus, Upload, Download, FileCheck, FileX, Search } from 'lucide-react'
import { apiGet, apiPost, baseURL } from '../../api/client'
import api from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge, Pagination } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

const BLANK = { name: '', email: '', student_id: '', phone: '', branch: '', degree: '', graduation_year: '', cgpa: '', tenth_pct: '', twelfth_pct: '', backlogs: '', skills: '', preferred_role: '' }

export default function CollegeStudents() {
  const { slug } = useParams()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, loading, error, refetch } = useFetch(`/college/${slug}/students?search=${encodeURIComponent(q)}&page=${page}`, [q, page, slug])
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [importModal, setImportModal] = useState(false)
  const [validation, setValidation] = useState(null)
  const [importFile, setImportFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const addStudent = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required')
    setBusy(true)
    try {
      await apiPost(`/college/${slug}/students`, { ...form, skills: form.skills.split(/[;,]/).map((s) => s.trim()).filter(Boolean) })
      toast.success('Student added'); setAddModal(false); setForm(BLANK); refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const runValidate = async (file) => {
    setImportFile(file)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await api.post(`/college/${slug}/students/import/validate`, fd, { headers: { 'Content-Type': undefined } })
      setValidation(res.data?.data)
    } catch (e) { toast.error(e.message) }
  }
  const commitImport = async () => {
    setBusy(true)
    try {
      const res = await apiPost(`/college/${slug}/students/import/commit`, { valid_rows: validation.valid_rows, filename: importFile?.name })
      toast.success(res.message || 'Imported'); setImportModal(false); setValidation(null); setImportFile(null); refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  const uploadResume = async (sid, file) => {
    if (!file) return
    const fd = new FormData(); fd.append('resume', file)
    try {
      await api.post(`/college/${slug}/students/${sid}/resume`, fd, { headers: { 'Content-Type': undefined } })
      toast.success('Resume uploaded'); refetch()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <PageHeader title="Students" subtitle="Your college talent pool. Reusable across every opportunity." icon={Users}
        actions={<div className="flex">
          <a className="btn-soft btn-sm" href={`${baseURL}/templates/students`}><Download size={14} /> Template</a>
          <button className="btn-soft btn-sm" onClick={() => setImportModal(true)}><Upload size={14} /> Import</button>
          <button className="btn-primary btn-sm" onClick={() => setAddModal(true)}><Plus size={14} /> Add</button>
        </div>} />

      {/* Search Filter Bar */}
      <div className="card flex wrap mb-4" style={{ gap: 12, padding: '16px 20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 40, background: 'var(--surface-2)', width: '100%' }} placeholder="Search students by name, email, or USN..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={refetch} /> :
        (data?.items || []).length === 0 ? (
          <EmptyState icon={Users} title="No students yet" message="Add students individually or import a CSV/Excel file." />
        ) : (
          <>
            <div className="card mt-4" style={{ padding: 0 }}>
              <table className="data">
                <thead><tr><th>Student</th><th>USN</th><th>Branch</th><th>CGPA</th><th>Grad</th><th>Resume</th></tr></thead>
                <tbody>
                  {data.items.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong><div className="muted" style={{ fontSize: 12 }}>{s.email}</div></td>
                      <td className="muted">{s.student_code || '—'}</td>
                      <td>{s.branch || '—'}</td>
                      <td>{s.cgpa ?? '—'}</td>
                      <td>{s.graduation_year || '—'}</td>
                      <td>
                        {s.has_resume ? (
                          <a className="link flex" style={{ gap: 4 }} href={`${baseURL}/files/${s.resume_file}?token=${localStorage.getItem('hr_token')}`} target="_blank" rel="noreferrer"><FileCheck size={15} color="var(--green-500)" /> View</a>
                        ) : (
                          <label className="link flex" style={{ gap: 4, cursor: 'pointer' }}><FileX size={15} color="var(--red-500)" /> Upload
                            <input type="file" hidden accept=".pdf,.txt" onChange={(e) => uploadResume(s.id, e.target.files[0])} /></label>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} perPage={data.per_page} total={data.total} onPage={setPage} />
          </>
        )}

      {/* Add modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Student" width={560}
        footer={<><button className="btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={addStudent} disabled={busy}>{busy ? 'Saving…' : 'Add'}</button></>}>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Email *</label><input className="input" value={form.email} onChange={set('email')} /></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>USN / Student ID</label><input className="input" value={form.student_id} onChange={set('student_id')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Branch</label><input className="input" value={form.branch} onChange={set('branch')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Degree</label><input className="input" value={form.degree} onChange={set('degree')} /></div>
          <div className="field" style={{ width: 100 }}><label>Grad year</label><input className="input" value={form.graduation_year} onChange={set('graduation_year')} /></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>CGPA</label><input className="input" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={set('cgpa')} /></div>
          <div className="field" style={{ flex: 1 }}><label>10th %</label><input className="input" type="number" step="0.1" min="0" max="100" value={form.tenth_pct} onChange={set('tenth_pct')} /></div>
          <div className="field" style={{ flex: 1 }}><label>12th %</label><input className="input" type="number" step="0.1" min="0" max="100" value={form.twelfth_pct} onChange={set('twelfth_pct')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Backlogs</label><input className="input" type="number" value={form.backlogs} onChange={set('backlogs')} /></div>
        </div>
        <div className="field"><label>Skills (semicolon separated)</label><input className="input" value={form.skills} onChange={set('skills')} placeholder="Python; SQL; React" /></div>
        <div className="field"><label>Preferred role</label><input className="input" value={form.preferred_role} onChange={set('preferred_role')} /></div>
      </Modal>

      {/* Import modal */}
      <Modal open={importModal} onClose={() => { setImportModal(false); setValidation(null) }} title="Import Students" width={560}
        footer={validation?.valid ? <><button className="btn-ghost" onClick={() => setValidation(null)}>Back</button>
          <button className="btn-primary" onClick={commitImport} disabled={busy}>{busy ? 'Importing…' : `Import ${validation.valid_rows.length}`}</button></> : null}>
        {!validation ? (
          <div>
            <p className="muted mb-4">Upload a CSV or Excel file. Download the template first to see the required columns.</p>
            <label className="btn-soft btn-block" style={{ cursor: 'pointer' }}><Upload size={15} /> Choose file
              <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files[0] && runValidate(e.target.files[0])} /></label>
          </div>
        ) : (
          <div>
            <p className="mb-4">{validation.message}</p>
            <div className="flex mb-4"><Badge variant="badge-green">{validation.valid_rows.length} valid</Badge>
              <Badge variant="badge-red">{validation.invalid_rows.length} invalid</Badge></div>
            {validation.invalid_rows.length > 0 && (
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                <table className="data"><thead><tr><th>Row</th><th>Error</th></tr></thead>
                  <tbody>{validation.invalid_rows.map((e, i) => <tr key={i}><td>{e.row}</td><td className="muted">{e.error}</td></tr>)}</tbody></table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

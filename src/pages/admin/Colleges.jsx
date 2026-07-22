import { useState } from 'react'
import { Building2, Plus, Users, Briefcase, ExternalLink, Search, MessageSquare, Upload, Download } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, StatCard, PageHeader, Modal, Badge } from '../../components/UI'
import api, { apiPost, apiPut, baseURL } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

const BLANK = { name: '', location: '', website: '', contact_person: '', contact_email: '', contact_phone: '', status: 'Active' }

export default function Colleges() {
  const { data, loading, error, refetch } = useFetch('/admin/colleges')
  const { hasRole } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [busy, setBusy] = useState(false)

  const [importModal, setImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [validation, setValidation] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const open = (c) => { setForm(c ? { ...BLANK, ...c } : BLANK); setModal(c ? 'edit' : 'new') }
  const save = async () => {
    if (!form.name.trim()) return toast.error('College name is required')
    setBusy(true)
    try {
      if (modal === 'edit') await apiPut(`/admin/colleges/${form.id}`, form)
      else await apiPost('/admin/colleges', form)
      toast.success('Saved'); setModal(null); refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const [notifyModal, setNotifyModal] = useState(null)
  const [notifyMsg, setNotifyMsg] = useState('')
  const sendNotify = async () => {
    if (!notifyMsg.trim()) return toast.error('Message is required')
    setBusy(true)
    try {
      const res = await apiPost(`/admin/colleges/${notifyModal.id}/notify`, { message: notifyMsg })
      toast.success(`Sent to ${res.sent_count} officers!`)
      setNotifyModal(null); setNotifyMsg('')
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const runValidate = async (file) => {
    setImportFile(file)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/admin/colleges/import/validate', fd, { headers: { 'Content-Type': undefined } })
      setValidation(res.data?.data)
    } catch (e) { toast.error(e.message) }
  }

  const commitImport = async () => {
    setBusy(true)
    try {
      const res = await apiPost('/admin/colleges/import/commit', { valid_rows: validation.valid_rows, filename: importFile?.name })
      toast.success(res.message || 'Imported')
      setImportModal(false)
      setValidation(null)
      setImportFile(null)
      refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  const stats = data?.stats || {}
  const items = (data?.items || []).filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader title="Colleges" subtitle="Master college list and placement portals." icon={Building2}
        actions={hasRole('ADMIN') && (
          <div className="flex" style={{ gap: 8 }}>
            <a className="btn-soft btn-sm flex" href={`${baseURL}/templates/colleges`} download>
              <Download size={14} /> Template
            </a>
            <button className="btn-soft btn-sm flex" onClick={() => setImportModal(true)}>
              <Upload size={14} /> Import CSV
            </button>
            <button className="btn-primary btn-sm flex" onClick={() => open(null)}>
              <Plus size={14} /> Add College
            </button>
          </div>
        )} />

      <div className="grid-stats mb-4">
        <StatCard icon={Building2} label="Colleges" value={stats.total ?? 0} tone="brand" />
        <StatCard icon={Building2} label="Active" value={stats.active ?? 0} tone="green" />
        <StatCard icon={Users} label="Students" value={stats.students ?? 0} tone="violet" />
        <StatCard icon={Users} label="Officers" value={stats.officers ?? 0} tone="blue" />
      </div>

      {/* Search Filter Bar */}
      <div className="card flex wrap mb-4" style={{ gap: 12, padding: '16px 20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 40, background: 'var(--surface-2)', width: '100%' }} placeholder="Search colleges by name or location..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Building2} title="No colleges yet" message="Add your first college to start assigning campus drives." />
      ) : (
        <div className="grid-cards mt-4">
          {items.map((c) => (
            <div key={c.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
              <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1.2, marginBottom: 4 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{c.location || 'Location not specified'}</div>
                </div>
                <Badge variant={c.status === 'Active' ? 'badge-green' : 'badge-gray'}>{c.status}</Badge>
              </div>
              
              <div className="flex" style={{ gap: 16, marginBottom: 20 }}>
                <div className="flex" style={{ gap: 6, color: 'var(--text-2)' }}>
                  <div style={{ padding: 6, background: 'var(--brand-50)', color: 'var(--brand-600)', borderRadius: 8 }}>
                    <Users size={14} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.student_count}</span>
                  <span className="muted" style={{ fontSize: 13 }}>students</span>
                </div>
                <div className="flex" style={{ gap: 6, color: 'var(--text-2)' }}>
                  <div style={{ padding: 6, background: 'var(--brand-50)', color: 'var(--brand-600)', borderRadius: 8 }}>
                    <Briefcase size={14} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.assigned_jobs}</span>
                  <span className="muted" style={{ fontSize: 13 }}>JDs</span>
                </div>
              </div>
              
              <div className="divider" style={{ margin: '0 0 16px 0' }} />
              
              <div className="flex wrap" style={{ justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                <code className="chip-gray chip" style={{ fontSize: 11, fontFamily: 'monospace' }}>/{c.slug}</code>
                <div className="flex wrap" style={{ gap: 8 }}>
                  <button className="btn-ghost btn-sm flex" onClick={() => { setNotifyModal(c); setNotifyMsg('') }} title="Message Placement Officer" style={{ borderRadius: '50%', padding: '8px' }}>
                    <MessageSquare size={14} />
                  </button>
                  {hasRole('ADMIN') && <button className="btn-ghost btn-sm flex" onClick={() => open(c)} style={{ borderRadius: '20px' }}>Edit</button>}
                  <a className="btn-primary btn-sm flex" href={`/${c.slug}`} target="_blank" rel="noreferrer" style={{ borderRadius: '20px' }}>Portal <ExternalLink size={14} /></a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit College' : 'Add College'}
        footer={<><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}>
        <div className="field"><label>College name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div className="field"><label>Location</label><input className="input" value={form.location} onChange={set('location')} /></div>
        <div className="field"><label>Website</label><input className="input" value={form.website} onChange={set('website')} /></div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Contact person</label><input className="input" value={form.contact_person} onChange={set('contact_person')} /></div>
          <div className="field" style={{ flex: 1 }}><label>Contact email</label><input className="input" value={form.contact_email} onChange={set('contact_email')} /></div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Contact phone</label><input className="input" value={form.contact_phone} onChange={set('contact_phone')} /></div>
          <div className="field" style={{ width: 140 }}><label>Status</label>
            <select className="select" value={form.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select></div>
        </div>
      </Modal>

      <Modal open={!!notifyModal} onClose={() => setNotifyModal(null)} title={`Notify ${notifyModal?.name}`}
        footer={<><button className="btn-ghost" onClick={() => setNotifyModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={sendNotify} disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button></>}>
        <p className="muted mb-4" style={{ fontSize: 13.5 }}>This will send a notification directly to the placement officer(s) of this college.</p>
        <div className="field">
          <label>Message *</label>
          <textarea className="input" rows={4} value={notifyMsg} onChange={(e) => setNotifyMsg(e.target.value)} placeholder="E.g. Please update your college portal with the latest placement statistics." />
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal open={importModal} onClose={() => { setImportModal(false); setValidation(null) }} title="Import Colleges" width={560}
        footer={validation?.valid ? <><button className="btn-ghost" onClick={() => setValidation(null)}>Back</button>
          <button className="btn-primary" onClick={commitImport} disabled={busy}>{busy ? 'Importing…' : `Import ${validation.valid_rows.length}`}</button></> : null}>
        {!validation ? (
          <div>
            <p className="muted mb-4">Upload a CSV or Excel file containing college details. Download the sample template first to see the required columns.</p>
            <label className="btn-soft btn-block" style={{ cursor: 'pointer' }}><Upload size={15} /> Choose file
              <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files[0] && runValidate(e.target.files[0])} /></label>
          </div>
        ) : (
          <div>
            <p className="mb-4">{validation.message}</p>
            <div className="flex mb-4" style={{ gap: 8 }}>
              <Badge variant="badge-green">{validation.valid_rows.length} valid</Badge>
              <Badge variant="badge-red">{validation.invalid_rows.length} invalid</Badge>
            </div>
            {validation.invalid_rows.length > 0 && (
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                <table className="data">
                  <thead><tr><th>Row</th><th>Error</th></tr></thead>
                  <tbody>{validation.invalid_rows.map((e, i) => <tr key={i}><td>{e.row}</td><td className="muted">{e.error}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

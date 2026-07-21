import { useState } from 'react'
import { Rocket, Plus } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge } from '../../components/UI'
import api, { apiPost, apiPut } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { fmtDate } from '../../utils/helpers'

export default function Drives() {
  const { data, loading, error, refetch } = useFetch('/admin/drives')
  const { data: jobsData } = useFetch('/jds')
  const { data: collegeData } = useFetch('/admin/colleges')
  const { hasRole } = useAuth()
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ id: null, name: '', description: '', start_date: '', end_date: '', job_ids: [], college_ids: [], status: 'Planned' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const openNew = () => {
    setForm({ id: null, name: '', description: '', start_date: '', end_date: '', job_ids: [], college_ids: [], status: 'Planned' })
    setModal('new')
  }

  const openEdit = (d) => {
    setForm({ id: d.id, name: d.name, description: d.description || '', start_date: d.start_date || '', end_date: d.end_date || '', job_ids: d.job_ids || [], college_ids: d.college_ids || [], status: d.status || 'Planned' })
    setModal('edit')
  }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Drive name is required')
    setBusy(true)
    try {
      if (modal === 'edit') {
        await apiPut(`/admin/drives/${form.id}`, form)
        toast.success('Drive updated')
      } else {
        await apiPost('/admin/drives', form)
        toast.success('Drive created')
      }
      setModal(null)
      refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const del = async (id) => {
    if (!window.confirm('Delete this placement drive?')) return
    try {
      await api.delete(`/admin/drives/${id}`)
      toast.success('Drive deleted'); refetch()
    } catch (e) { toast.error(e.response?.data?.error || e.message) }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div>
      <PageHeader title="Placement Drives" subtitle="Group JDs and colleges into campus drives." icon={Rocket}
        actions={hasRole('ADMIN') && <button className="btn-primary" onClick={openNew}><Plus size={16} /> New Drive</button>} />
      {(data || []).length === 0 ? (
        <EmptyState icon={Rocket} title="No drives yet" message="Create a placement drive to organise campus hiring." />
      ) : (
        <div className="grid-cards">
          {data.map((d) => (
            <div key={d.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, marginBottom: 4 }}>{d.name}</div>
                  <Badge variant={d.status === 'Completed' ? 'badge-green' : d.status === 'Active' ? 'badge-blue' : 'badge-gray'}>{d.status}</Badge>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16, flex: 1 }}>{d.description || 'No description provided.'}</p>
              
              <div className="flex" style={{ gap: 16, marginBottom: 20 }}>
                <div className="flex" style={{ gap: 6, color: 'var(--text-2)' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{d.job_ids.length}</span> <span className="muted" style={{ fontSize: 13 }}>JDs</span>
                </div>
                <div className="flex" style={{ gap: 6, color: 'var(--text-2)' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{d.college_ids.length}</span> <span className="muted" style={{ fontSize: 13 }}>colleges</span>
                </div>
              </div>
              
              <div className="divider" style={{ margin: '0 0 16px 0' }} />
              
              <div className="row-between">
                <div className="muted" style={{ fontSize: 12 }}>
                  {d.start_date ? `${fmtDate(d.start_date)} → ${d.end_date ? fmtDate(d.end_date) : 'Ongoing'}` : 'Dates not set'}
                </div>
                <div className="flex" style={{ gap: 8 }}>
                  {hasRole('ADMIN') && (
                    <>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(d)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => del(d.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Drive' : 'New Placement Drive'}
        footer={<><button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Drive name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
          {modal === 'edit' && (
            <div className="field" style={{ width: 140 }}><label>Status</label>
              <select className="select" value={form.status} onChange={set('status')}>
                <option>Planned</option><option>Active</option><option>Completed</option>
              </select>
            </div>
          )}
        </div>
        <div className="field"><label>Description</label><textarea className="input" rows={2} value={form.description} onChange={set('description')} /></div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Start date</label><input className="input" type="date" value={form.start_date} onChange={set('start_date')} /></div>
          <div className="field" style={{ flex: 1 }}><label>End date</label><input className="input" type="date" value={form.end_date} onChange={set('end_date')} /></div>
        </div>
        <MultiPick label="Jobs" options={(jobsData?.items || []).map((j) => ({ id: j.id, name: j.title }))}
          selected={form.job_ids} onChange={(v) => setForm({ ...form, job_ids: v })} />
        <MultiPick label="Colleges" options={(collegeData?.items || []).map((c) => ({ id: c.id, name: c.name }))}
          selected={form.college_ids} onChange={(v) => setForm({ ...form, college_ids: v })} />
      </Modal>
    </div>
  )
}

function MultiPick({ label, options, selected, onChange }) {
  return (
    <div className="field"><label>{label}</label>
      <div className="stack" style={{ gap: 5, maxHeight: 130, overflowY: 'auto' }}>
        {options.length === 0 && <span className="muted">None available</span>}
        {options.map((o) => (
          <label key={o.id} className="flex" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={selected.includes(o.id)}
              onChange={(e) => onChange(e.target.checked ? [...selected, o.id] : selected.filter((x) => x !== o.id))} />
            {o.name}
          </label>
        ))}
      </div>
    </div>
  )
}

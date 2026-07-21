import { useState } from 'react'
import { UserCheck, Plus } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge, Avatar } from '../../components/UI'
import { apiPost, apiPut } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'

export default function Interviewers() {
  const { data: interviewers, loading, error, refetch } = useFetch('/interviewers')
  const toast = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', title: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const create = async () => {
    if (!form.name || !form.email || !form.password)
      return toast.error('Name, email, and password are required')
    setBusy(true)
    try {
      await apiPost('/interviewers', form)
      toast.success('Interviewer created')
      setModal(false); setForm({ name: '', email: '', password: '', phone: '', title: '' }); refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const toggle = async (u) => {
    try { await apiPut(`/interviewers/${u.id}`, { is_active: !u.is_active }); refetch() }
    catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div>
      <PageHeader title="Interviewers" subtitle="Create and manage interviewer accounts." icon={UserCheck}
        actions={<button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Add Interviewer</button>} />

      {(interviewers || []).length === 0 ? (
        <EmptyState icon={UserCheck} title="No interviewers yet"
          message="Add an interviewer to start assigning them to pipeline stages." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>Specialization</th><th>Assigned</th><th>Pending Verdicts</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {interviewers.map((u) => (
                <tr key={u.id}>
                  <td><div className="flex"><Avatar name={u.name} size={30} /> {u.name}</div></td>
                  <td className="muted">{u.email}</td>
                  <td>{u.title || '—'}</td>
                  <td>{u.assigned_count || 0}</td>
                  <td>{u.pending_verdicts > 0 ? <Badge variant="badge-yellow">{u.pending_verdicts} Pending</Badge> : <span className="muted">0</span>}</td>
                  <td><Badge variant={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Disabled'}</Badge></td>
                  <td><button className="btn-ghost btn-sm" onClick={() => toggle(u)}>{u.is_active ? 'Disable' : 'Enable'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Interviewer"
        footer={<><button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create'}</button></>}>
        <div className="field"><label>Full name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div className="field"><label>Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
        <div className="field"><label>Specialization (Title)</label><input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Senior Frontend Engineer" /></div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Temp password *</label><input className="input" value={form.password} onChange={set('password')} placeholder="Min 6 chars" /></div>
          <div className="field" style={{ flex: 1 }}><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
        </div>
      </Modal>
    </div>
  )
}

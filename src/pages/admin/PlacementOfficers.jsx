import { useState } from 'react'
import { UserCog, Plus, ExternalLink } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge, Avatar } from '../../components/UI'
import { apiPost, apiPut } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'

export default function PlacementOfficers() {
  const { data: officers, loading, error, refetch } = useFetch('/admin/placement-officers')
  const { data: collegeData } = useFetch('/admin/colleges')
  const toast = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', college_id: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const colleges = collegeData?.items || []

  const create = async () => {
    if (!form.name || !form.email || !form.password || !form.college_id)
      return toast.error('All fields except phone are required')
    setBusy(true)
    try {
      const res = await apiPost('/admin/placement-officers', form)
      toast.success('Officer created')
      setModal(false); setForm({ name: '', email: '', password: '', phone: '', college_id: '' }); refetch()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const toggle = async (u) => {
    try { await apiPut(`/admin/placement-officers/${u.id}`, { is_active: !u.is_active }); refetch() }
    catch (e) { toast.error(e.message) }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div>
      <PageHeader title="Placement Officers" subtitle="Create and manage college placement officer accounts." icon={UserCog}
        actions={<button className="btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Add Officer</button>} />

      {(officers || []).length === 0 ? (
        <EmptyState icon={UserCog} title="No placement officers yet"
          message="Add a placement officer and share their college portal login link." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>College</th><th>Portal</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {officers.map((u) => (
                <tr key={u.id}>
                  <td><div className="flex"><Avatar name={u.name} size={30} /> {u.name}</div></td>
                  <td className="muted">{u.email}</td>
                  <td>{u.college_name || '—'}</td>
                  <td>{u.college_slug && <a className="link flex" style={{ gap: 4 }} href={`/${u.college_slug}/login`} target="_blank" rel="noreferrer">/{u.college_slug} <ExternalLink size={12} /></a>}</td>
                  <td><Badge variant={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Disabled'}</Badge></td>
                  <td><button className="btn-ghost btn-sm" onClick={() => toggle(u)}>{u.is_active ? 'Disable' : 'Enable'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Placement Officer"
        footer={<><button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create'}</button></>}>
        <div className="field"><label>Full name *</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div className="field"><label>Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
        <div className="field"><label>College *</label>
          <select className="select" value={form.college_id} onChange={set('college_id')}>
            <option value="">Select a college…</option>
            {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Temp password *</label><input className="input" value={form.password} onChange={set('password')} placeholder="Min 6 chars" /></div>
          <div className="field" style={{ flex: 1 }}><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
        </div>
        {colleges.length === 0 && <p className="muted">Add a college first before creating officers.</p>}
      </Modal>
    </div>
  )
}

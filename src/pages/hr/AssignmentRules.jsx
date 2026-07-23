import { useState } from 'react'
import { Sliders, Plus, Play, Trash2, Edit3, CheckCircle2, Zap, AlertCircle } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../../api/client'
import api from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

const BLANK_RULE = {
  name: '',
  course_id: '',
  match_designation: '',
  match_department: '',
  match_location: '',
  recurrence: 'Quarterly',
  due_days: 30,
  is_active: true
}

export default function AssignmentRules() {
  const toast = useToast()
  const { data: rules, loading, error, refetch } = useFetch('/training/rules')
  const { data: courses } = useFetch('/training/courses')

  const [ruleModal, setRuleModal] = useState(false)
  const [form, setForm] = useState(BLANK_RULE)
  const [editId, setEditId] = useState(null)
  
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null)

  const [busy, setBusy] = useState(false)
  const setR = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const openAdd = () => {
    setEditId(null)
    setForm({
      ...BLANK_RULE,
      course_id: courses && courses.length ? courses[0].id : ''
    })
    setRuleModal(true)
  }

  const openEdit = (r) => {
    setEditId(r.id)
    setForm({
      name: r.name || '',
      course_id: r.course_id || '',
      match_designation: r.match_designation || '',
      match_department: r.match_department || '',
      match_location: r.match_location || '',
      recurrence: r.recurrence || 'Quarterly',
      due_days: r.due_days || 30,
      is_active: r.is_active ?? true
    })
    setRuleModal(true)
  }

  const saveRule = async () => {
    if (!form.name || !form.course_id) {
      return toast.error('Rule name and course selection are required.')
    }
    setBusy(true)
    try {
      if (editId) {
        await apiPut(`/training/rules/${editId}`, form)
        toast.success('Assignment rule updated')
      } else {
        await apiPost('/training/rules', form)
        toast.success('Assignment rule created')
      }
      setRuleModal(false)
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to save rule')
    } finally {
      setBusy(false)
    }
  }

  const deleteRule = async (rid) => {
    if (!window.confirm('Delete this rule?')) return
    try {
      await api.delete(`/training/rules/${rid}`)
      toast.success('Rule deleted')
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to delete rule')
    }
  }

  const runEngine = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await apiPost('/training/rules/run', {})
      setRunResult(res)
      toast.success(res.message || 'Rules executed for current quarter cycle!')
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to run assignment engine')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Assignment Rules"
        subtitle="Automate recurring training assignments based on designation, department, or location matching criteria."
        icon={Sliders}
        actions={
          <div className="flex" style={{ gap: 8 }}>
            <button className="btn-soft btn-sm flex" style={{ gap: 6, color: 'var(--brand-600)' }} onClick={runEngine} disabled={running}>
              <Play size={14} /> <span>{running ? 'Evaluating Rules…' : 'Run for this Cycle'}</span>
            </button>
            <button className="btn-primary btn-sm flex" style={{ gap: 4 }} onClick={openAdd}>
              <Plus size={14} /> <span>New Rule</span>
            </button>
          </div>
        }
      />

      {/* Execution Summary Banner */}
      {runResult && (
        <div className="card mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 20px' }}>
          <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
            <Zap size={22} color="#16a34a" />
            <div>
              <h4 style={{ margin: 0, fontSize: 15, color: '#15803d', fontWeight: 800 }}>
                Rule Engine Execution — Cycle {runResult.cycle}
              </h4>
              <div style={{ fontSize: 13, color: '#166534', marginTop: 2 }}>
                Rules Evaluated: <strong>{runResult.rules_evaluated}</strong> • Matched Employees: <strong>{runResult.matches_found}</strong> • New Assignments Created: <strong>{runResult.assignments_created}</strong> • Overdue Flagged: <strong>{runResult.overdue_flagged}</strong>
              </div>
            </div>
            <button className="btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setRunResult(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (rules || []).length === 0 ? (
        <EmptyState icon={Sliders} title="No assignment rules set" message="Create rules to automatically assign quarterly compliance and technology trainings." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Target Course</th>
                <th>Designation Match</th>
                <th>Department Match</th>
                <th>Location Match</th>
                <th>Due Days</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong style={{ fontSize: 14 }}>{r.name}</strong>
                  </td>
                  <td>
                    <span className="chip" style={{ fontWeight: 600 }}>{r.course_title || '—'}</span>
                  </td>
                  <td>{r.match_designation ? <Badge variant="badge-blue">{r.match_designation}</Badge> : <span className="muted">All</span>}</td>
                  <td>{r.match_department ? <Badge variant="badge-blue">{r.match_department}</Badge> : <span className="muted">All</span>}</td>
                  <td>{r.match_location ? <Badge variant="badge-blue">{r.match_location}</Badge> : <span className="muted">All</span>}</td>
                  <td>{r.due_days} days</td>
                  <td>
                    <Badge variant={r.is_active ? 'badge-green' : 'badge-red'}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(r)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-ghost btn-sm" style={{ color: 'var(--red-500)' }} onClick={() => deleteRule(r.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      <Modal
        open={ruleModal}
        onClose={() => setRuleModal(false)}
        title={editId ? "Edit Assignment Rule" : "New Assignment Rule"}
        width={560}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setRuleModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveRule} disabled={busy}>
              {busy ? 'Saving…' : editId ? 'Update Rule' : 'Create Rule'}
            </button>
          </>
        }
      >
        <div className="field">
          <label>Rule Name *</label>
          <input className="input" value={form.name} onChange={setR('name')} placeholder="e.g. Mandatory HCM Training for Engineering" />
        </div>

        <div className="field">
          <label>Target Course *</label>
          <select className="select" value={form.course_id} onChange={setR('course_id')}>
            <option value="">Select a course</option>
            {(courses || []).map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Match Designation (leave blank to match all)</label>
          <input className="input" value={form.match_designation} onChange={setR('match_designation')} placeholder="e.g. Software Engineer" />
        </div>

        <div className="field">
          <label>Match Department (leave blank to match all)</label>
          <input className="input" value={form.match_department} onChange={setR('match_department')} placeholder="e.g. Engineering" />
        </div>

        <div className="field">
          <label>Match Location (leave blank to match all)</label>
          <input className="input" value={form.match_location} onChange={setR('match_location')} placeholder="e.g. Bengaluru" />
        </div>

        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Recurrence Cycle</label>
            <select className="select" value={form.recurrence} onChange={setR('recurrence')}>
              <option value="Quarterly">Quarterly</option>
              <option value="One-time">One-time</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Days Allowed to Complete</label>
            <input className="input" type="number" min="1" value={form.due_days} onChange={setR('due_days')} />
          </div>
        </div>

        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="rule_active_check" checked={form.is_active} onChange={setR('is_active')} />
          <label htmlFor="rule_active_check" style={{ margin: 0, cursor: 'pointer' }}>Active Rule</label>
        </div>
      </Modal>
    </div>
  )
}

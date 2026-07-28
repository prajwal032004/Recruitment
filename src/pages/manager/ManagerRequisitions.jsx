import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ClipboardList, Plus, Search, Filter, Pencil, Trash2, UserCheck,
  Building2, Briefcase, Clock, AlertCircle, CheckCircle2, AlertTriangle, X
} from 'lucide-react'
import { apiGet, apiPut, apiDelete } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner, ErrorState, EmptyState, Badge, Modal } from '../../components/UI'
import HiringRequestCreateModal from './HiringRequestCreateModal'

export default function ManagerRequisitions() {
  const { deptSlug } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const navigate = useNavigate()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingReq, setEditingReq] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    openings: 1,
    priority: 'Medium',
    location: '',
    employment_type: 'Full-time',
    budget_min: '',
    budget_max: '',
    experience_min: 0,
    required_skills: '',
    description: ''
  })
  const [editBusy, setEditBusy] = useState(false)

  // Delete Confirmation Popup Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingReq, setDeletingReq] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await apiGet(`/manager/hiring-requests?dept_slug=${slug}`)
      setRequests(data || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load position requisitions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [slug])

  // Open Edit Modal
  const openEditModal = (req) => {
    setEditingReq(req)
    setEditForm({
      title: req.title || '',
      openings: req.openings || 1,
      priority: req.priority || 'Medium',
      location: req.location || '',
      employment_type: req.employment_type || 'Full-time',
      budget_min: req.budget_min ?? '',
      budget_max: req.budget_max ?? '',
      experience_min: req.experience_min ?? 0,
      required_skills: Array.isArray(req.required_skills) ? req.required_skills.join(', ') : (req.required_skills || ''),
      description: req.description || ''
    })
    setEditModalOpen(true)
  }

  // Handle Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingReq) return
    if (!editForm.title.trim()) return toast.error('Position title is required.')

    setEditBusy(true)
    try {
      const res = await apiPut(`/manager/hiring-requests/${editingReq.id}`, editForm)
      toast.success(res.message || 'Requisition updated successfully!')
      setEditModalOpen(false)
      loadRequests()
    } catch (err) {
      toast.error(err.message || 'Failed to update requisition.')
    } finally {
      setEditBusy(false)
    }
  }

  // Open Delete Modal
  const openDeleteModal = (req) => {
    setDeletingReq(req)
    setDeleteModalOpen(true)
  }

  // Handle Execute Delete
  const handleExecuteDelete = async () => {
    if (!deletingReq) return
    setDeleteBusy(true)
    try {
      const res = await apiDelete(`/manager/hiring-requests/${deletingReq.id}`)
      toast.success(res.message || 'Position requisition deleted!')
      setDeleteModalOpen(false)
      setDeletingReq(null)
      loadRequests()
    } catch (err) {
      toast.error(err.message || 'Failed to delete requisition.')
    } finally {
      setDeleteBusy(false)
    }
  }

  const filteredReqs = requests.filter(r => {
    if (!r) return false
    const matchesSearch = (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.required_skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  const totalOpenings = requests.reduce((acc, r) => acc + (r.openings || 1), 0)
  const pendingCount = requests.filter(r => r.status === 'Pending').length
  const activeCount = requests.filter(r => r.status === 'In Progress' || r.status === 'Approved').length

  if (loading && requests.length === 0) return <LoadingSpinner full label="Loading Position Requisitions..." />

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: 28,
          boxShadow: '0 16px 36px -10px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.6px',
                textTransform: 'uppercase'
              }}
            >
              DEPARTMENT REQUISITIONS
            </span>
            <span style={{ fontSize: 12.5, color: '#cbd5e1', fontWeight: 600 }}>
              DEPARTMENT: <strong style={{ color: '#ffffff' }}>{slug.toUpperCase()}</strong>
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
            Hiring Requisitions Management
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', maxWidth: 640 }}>
            Create, track, edit, and manage hiring requests for your department. Request headcount and review assigned candidates.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
          }}
        >
          <Plus size={18} />
          <span>New Position Requisition</span>
        </button>
      </div>

      {/* Stats Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Requisitions</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{requests.length}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Target Headcount</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>{totalOpenings} Positions</div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>In Progress / Active</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>{activeCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px 20px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pending Review</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{pendingCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 540 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              pointerEvents: 'none',
              zIndex: 2
            }}
          />
          <input
            type="text"
            placeholder="Search requisitions by title, location, or skills..."
            style={{
              width: '100%',
              paddingLeft: 42,
              paddingRight: 16,
              height: 42,
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 500,
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              color: '#0f172a',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#64748b' }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '0 14px',
                height: 40,
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#64748b' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '0 14px',
                height: 40,
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Approved">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requisitions Data Table */}
      <div className="card p-0" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {filteredReqs.length === 0 ? (
          <EmptyState
            title="No Position Requisitions Found"
            message="No hiring requests match your filter. Click 'New Position Requisition' to submit a request."
          />
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Req ID</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Position Title</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Openings</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Budget Range</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Priority</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReqs.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 700, color: '#4f46e5' }}>#{req.id}</span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{req.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {req.employment_type || 'Full-time'} • {req.location || 'Remote'} {req.experience_min ? `• Min ${req.experience_min} yrs exp` : ''}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7' }}>
                        {req.openings} Seat{req.openings > 1 ? 's' : ''}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600 }}>
                      {req.budget_min || req.budget_max ? (
                        `₹${(req.budget_min || 0).toLocaleString()} - ₹${(req.budget_max || 0).toLocaleString()}`
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <Badge
                        variant={
                          req.priority === 'Urgent' || req.priority === 'High'
                            ? 'danger'
                            : req.priority === 'Medium'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {req.priority || 'Medium'}
                      </Badge>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <Badge
                        variant={
                          req.status === 'Approved'
                            ? 'success'
                            : req.status === 'In Progress'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {req.status}
                      </Badge>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => openEditModal(req)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Edit Position Requisition"
                        >
                          <Pencil size={13} style={{ color: '#4f46e5' }} /> Edit
                        </button>

                        <button
                          onClick={() => openDeleteModal(req)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#fff1f2',
                            color: '#e11d48',
                            border: '1px solid #fecdd3',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Delete Position Requisition"
                        >
                          <Trash2 size={13} /> Delete
                        </button>

                        <button
                          onClick={() => navigate(`/manager/${slug}/candidates`)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#eef2ff',
                            color: '#4f46e5',
                            border: '1px solid #c7d2fe',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="View Candidates"
                        >
                          <UserCheck size={13} /> Candidates
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Create New Requisition */}
      {createModalOpen && (
        <HiringRequestCreateModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false)
            loadRequests()
            toast.success('Hiring request created successfully!')
          }}
        />
      )}

      {/* Modal to Edit Requisition */}
      {editModalOpen && editingReq && (
        <Modal
          open={true}
          title={`Edit Requisition #${editingReq.id} — ${editingReq.title}`}
          onClose={() => setEditModalOpen(false)}
          width={640}
        >
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Position Title *</label>
              <input
                type="text"
                required
                className="input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                style={{ width: '100%', height: 42, borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Openings / Headcount Target *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input"
                  value={editForm.openings}
                  onChange={(e) => setEditForm({ ...editForm, openings: e.target.value })}
                  style={{ width: '100%', height: 42, borderRadius: 8 }}
                />
              </div>

              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Priority Level *</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="input"
                  style={{ width: '100%', height: 42, borderRadius: 8, fontWeight: 600 }}
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Location</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g. New York, Remote"
                  style={{ width: '100%', height: 42, borderRadius: 8 }}
                />
              </div>

              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Employment Type</label>
                <select
                  value={editForm.employment_type}
                  onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                  className="input"
                  style={{ width: '100%', height: 42, borderRadius: 8, fontWeight: 600 }}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Budget Min (₹ / INR)</label>
                <input
                  type="number"
                  className="input"
                  value={editForm.budget_min}
                  onChange={(e) => setEditForm({ ...editForm, budget_min: e.target.value })}
                  placeholder="600000"
                  style={{ width: '100%', height: 42, borderRadius: 8 }}
                />
              </div>

              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Budget Max (₹ / INR)</label>
                <input
                  type="number"
                  className="input"
                  value={editForm.budget_max}
                  onChange={(e) => setEditForm({ ...editForm, budget_max: e.target.value })}
                  placeholder="1500000"
                  style={{ width: '100%', height: 42, borderRadius: 8 }}
                />
              </div>
            </div>

            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Required Skills (comma separated)</label>
              <input
                type="text"
                className="input"
                value={editForm.required_skills}
                onChange={(e) => setEditForm({ ...editForm, required_skills: e.target.value })}
                placeholder="Python, React, SQL, Docker"
                style={{ width: '100%', height: 42, borderRadius: 8 }}
              />
            </div>

            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155' }}>Position Description</label>
              <textarea
                rows={3}
                className="input"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Brief summary of job responsibilities and goals..."
                style={{ width: '100%', borderRadius: 8, padding: 10 }}
              />
            </div>

            <div className="row gap-12 justify-end mt-16" style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditModalOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={editBusy}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', fontWeight: 700, height: 42, padding: '0 20px' }}
              >
                {editBusy ? 'Saving Changes...' : 'Save Requisition Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Popup Modal */}
      {deleteModalOpen && deletingReq && (
        <Modal
          open={true}
          title="Confirm Requisition Deletion"
          onClose={() => setDeleteModalOpen(false)}
          width={480}
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#fff1f2',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 8px 20px rgba(225, 29, 72, 0.2)'
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              Do you really want to delete this position requisition?
            </h3>

            <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Are you sure you want to delete requisition <strong>#{deletingReq.id} — {deletingReq.title}</strong>? This action cannot be undone and will permanently delete associated mappings.
            </p>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24, textAlign: 'left', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Position:</span>
                <strong>{deletingReq.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Openings Target:</span>
                <strong>{deletingReq.openings} Position(s)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Current Status:</span>
                <strong style={{ color: '#e11d48' }}>{deletingReq.status}</strong>
              </div>
            </div>

            <div className="row gap-12 justify-end" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExecuteDelete}
                disabled={deleteBusy}
                style={{
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  fontWeight: 700,
                  padding: '10px 22px'
                }}
              >
                {deleteBusy ? 'Deleting...' : 'Yes, Delete Requisition'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

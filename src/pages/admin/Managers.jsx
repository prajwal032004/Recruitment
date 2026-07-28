import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Users, Briefcase, Plus, Search, ExternalLink,
  ClipboardList, UserPlus, Shield, ChevronRight, CheckCircle2,
  Clock, AlertCircle, ArrowUpRight, LogIn, Sparkles, Filter,
  Mail, Award, UserCheck, Layers, TrendingUp, Share2, Copy,
  Trash2, Key, Lock, Eye, EyeOff, RotateCcw, AlertTriangle
} from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, StatCard, PageHeader, Badge, Modal } from '../../components/UI'
import { apiGet, apiPost, apiDelete } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import HiringRequestCreateModal from '../manager/HiringRequestCreateModal'

const DEPT_THEMES = {
  engineering: { bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', accent: '#38bdf8', iconColor: '#0284c7', lightBg: '#f0f9ff' },
  finance: { bg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', accent: '#34d399', iconColor: '#059669', lightBg: '#ecfdf5' },
  marketing: { bg: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)', accent: '#c084fc', iconColor: '#9333ea', lightBg: '#faf5ff' },
  sales: { bg: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)', accent: '#fb923c', iconColor: '#ea580c', lightBg: '#fff7ed' },
  hr: { bg: 'linear-gradient(135deg, #831f51 0%, #c5307b 100%)', accent: '#f472b6', iconColor: '#c5307b', lightBg: '#fdf2f8' },
}

export default function Managers() {
  const toast = useToast()
  const { data: departments, loading: deptsLoading, error: deptsErr, refetch: refetchDepts } = useFetch('/manager/departments')
  const { data: requests, loading: reqsLoading, error: reqsErr, refetch: refetchReqs } = useFetch('/manager/hiring-requests')

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('departments') // 'departments' | 'requests'
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [createReqModalOpen, setCreateReqModalOpen] = useState(false)

  // Assign Student Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedReqForAssign, setSelectedReqForAssign] = useState(null)
  const [studentsPool, setStudentsPool] = useState([])
  const [poolLoading, setPoolLoading] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [poolSearch, setPoolSearch] = useState('')
  const [assignBusy, setAssignBusy] = useState(false)

  // View Candidates Modal state
  const [viewCandModalOpen, setViewCandModalOpen] = useState(false)
  const [selectedReqForView, setSelectedReqForView] = useState(null)
  const [viewCandidatesList, setViewCandidatesList] = useState([])
  const [viewCandLoading, setViewCandLoading] = useState(false)
  const [viewCandSearch, setViewCandSearch] = useState('')
  const [undoBusy, setUndoBusy] = useState(false)

  // Delete Department Modal State
  const [deleteDeptModalOpen, setDeleteDeptModalOpen] = useState(false)
  const [deletingDept, setDeletingDept] = useState(null)
  const [deleteDeptBusy, setDeleteDeptBusy] = useState(false)

  // Delete Requisition Modal State
  const [deleteReqModalOpen, setDeleteReqModalOpen] = useState(false)
  const [deletingReq, setDeletingReq] = useState(null)
  const [deleteReqBusy, setDeleteReqBusy] = useState(false)

  const openViewCandidatesModal = async (req) => {
    setSelectedReqForView(req)
    setViewCandModalOpen(true)
    setViewCandLoading(true)
    try {
      const res = await apiGet(`/admin/hiring-requests/${req.id}/candidates`)
      setViewCandidatesList(res.candidates || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load candidates for requisition.')
    } finally {
      setViewCandLoading(false)
    }
  }

  const handleUndoAssignment = async (req) => {
    const remUndos = req.remaining_undos ?? (2 - (req.undo_count || 0))
    if (remUndos <= 0 || (req.undo_count || 0) >= 2) {
      return toast.error('Maximum undo limit reached. You can only undo assignments up to 2 times per position requisition.')
    }

    if (!window.confirm(`Are you sure you want to undo candidate assignment for requisition #${req.id} (${req.title})? You have ${remUndos} undos remaining.`)) {
      return
    }

    setUndoBusy(true)
    try {
      const res = await apiPost(`/admin/hiring-requests/${req.id}/undo-assignment`)
      toast.success(res.message || 'Assignment undone successfully!')
      refetchReqs()
      if (viewCandModalOpen && selectedReqForView?.id === req.id) {
        setViewCandModalOpen(false)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to undo assignment.')
    } finally {
      setUndoBusy(false)
    }
  }

  const openAssignModal = async (req) => {
    setSelectedReqForAssign(req)
    setSelectedStudentIds([])
    setAssignModalOpen(true)
    setPoolLoading(true)
    try {
      const pool = await apiGet('/admin/students-pool')
      setStudentsPool(pool || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load students pool.')
    } finally {
      setPoolLoading(false)
    }
  }

  const handleAssignStudents = async () => {
    if (!selectedReqForAssign) return
    if (selectedStudentIds.length === 0) return toast.error('Please select at least one student or candidate.')

    setAssignBusy(true)
    try {
      const studentIds = studentsPool.filter(s => selectedStudentIds.includes(s.id) && s.type === 'STUDENT').map(s => s.id)
      const candidateIds = studentsPool.filter(s => selectedStudentIds.includes(s.id) && s.type === 'CANDIDATE').map(s => s.id)

      await apiPost(`/admin/hiring-requests/${selectedReqForAssign.id}/assign-students`, {
        student_ids: studentIds,
        candidate_ids: candidateIds
      })
      toast.success(`Successfully assigned ${selectedStudentIds.length} candidate(s) to requisition!`)
      setAssignModalOpen(false)
      refetchReqs()
    } catch (err) {
      toast.error(err.message || 'Failed to assign students.')
    } finally {
      setAssignBusy(false)
    }
  }

  // Add Department Manager Modal State
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false)
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    manager_name: '',
    manager_email: '',
    password: 'manager123'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  // State for Confirmation Popup Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const loading = deptsLoading || reqsLoading
  if (loading) return <LoadingSpinner full label="Loading Department Portals & Requisitions..." />
  if (deptsErr || reqsErr) {
    return (
      <ErrorState
        message={deptsErr || reqsErr || 'Could not load department data.'}
        onRetry={() => {
          refetchDepts()
          refetchReqs()
        }}
      />
    )
  }

  const deptsList = Array.isArray(departments)
    ? departments
    : Array.isArray(departments?.data)
    ? departments.data
    : (departments?.items || [])

  const reqsList = Array.isArray(requests)
    ? requests
    : Array.isArray(requests?.data)
    ? requests.data
    : (requests?.items || [])

  // Stats calculation
  const totalDepts = deptsList.length
  const totalReqs = reqsList.length
  const pendingReqs = reqsList.filter(r => r && (r.status === 'Pending' || r.status === 'In Progress')).length
  const totalOpenings = reqsList.reduce((acc, r) => acc + (r?.openings || 1), 0)

  // Filtered lists with safety null checks
  const filteredDepts = deptsList.filter(d => {
    if (!d) return false
    const dName = d.name || ''
    const mName = d.manager_name || ''
    const dCode = d.code || ''
    const matchesSearch =
      dName.toLowerCase().includes(search.toLowerCase()) ||
      mName.toLowerCase().includes(search.toLowerCase()) ||
      dCode.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredReqs = reqsList.filter(r => {
    if (!r) return false
    const rTitle = r.title || ''
    const dName = r.department_name || ''
    const mName = r.manager_name || ''
    const matchesSearch =
      rTitle.toLowerCase().includes(search.toLowerCase()) ||
      dName.toLowerCase().includes(search.toLowerCase()) ||
      mName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Handle Add Department
  const handleAddDepartment = async (e) => {
    e.preventDefault()
    if (!deptForm.name || !deptForm.manager_email) {
      return toast.error('Department name and Manager email are required.')
    }
    setBusy(true)
    try {
      await apiPost('/manager/departments', deptForm)
      toast.success(`Department '${deptForm.name}' and Manager created!`)
      setAddDeptModalOpen(false)
      setDeptForm({ name: '', code: '', manager_name: '', manager_email: '', password: 'manager123' })
      refetchDepts()
    } catch (err) {
      toast.error(err.message || 'Failed to create department manager.')
    } finally {
      setBusy(false)
    }
  }

  // Handle Delete Department (Open Confirmation Modal)
  const openDeleteDepartmentModal = (dept) => {
    setDeletingDept(dept)
    setDeleteDeptModalOpen(true)
  }

  const handleConfirmDeleteDept = async () => {
    if (!deletingDept) return
    setDeleteDeptBusy(true)
    try {
      await apiDelete(`/manager/departments/${deletingDept.id}`)
      toast.success(`Department '${deletingDept.name}', manager account, and all associated position requisitions deleted successfully.`)
      setDeleteDeptModalOpen(false)
      setDeletingDept(null)
      refetchDepts()
      refetchReqs()
    } catch (err) {
      toast.error(err.message || 'Failed to delete department.')
    } finally {
      setDeleteDeptBusy(false)
    }
  }

  // Handle Delete Requisition (Open Confirmation Modal)
  const openDeleteReqModal = (req) => {
    setDeletingReq(req)
    setDeleteReqModalOpen(true)
  }

  const handleConfirmDeleteReq = async () => {
    if (!deletingReq) return
    setDeleteReqBusy(true)
    try {
      await apiDelete(`/manager/hiring-requests/${deletingReq.id}`)
      toast.success(`Position requisition #${deletingReq.id} deleted successfully.`)
      setDeleteReqModalOpen(false)
      setDeletingReq(null)
      refetchReqs()
    } catch (err) {
      toast.error(err.message || 'Failed to delete position requisition.')
    } finally {
      setDeleteReqBusy(false)
    }
  }

  // Share / Copy Credentials
  const handleShareCredentials = (d) => {
    const loginUrl = `${window.location.origin}/manager/${d.slug}/login`
    const credText = `🏢 DEPARTMENT MANAGER LOGIN CREDENTIALS\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Department: ${d.name}\n` +
      `Manager Name: ${d.manager_name || 'Department Manager'}\n` +
      `Manager Email: ${d.manager_email}\n` +
      `Portal Login URL: ${loginUrl}\n` +
      `Initial Password: manager123\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

    navigator.clipboard.writeText(credText)
    toast.success(`Credentials for ${d.name} copied to clipboard!`)
  }

  const handleAssignClick = () => {
    if (!selectedReqForAssign) return
    if (selectedStudentIds.length === 0) return toast.error('Please select at least one student or candidate.')
    setConfirmModalOpen(true)
  }

  const executeAssignStudents = async () => {
    if (!selectedReqForAssign) return
    setAssignBusy(true)
    try {
      const studentIds = studentsPool.filter(s => selectedStudentIds.includes(s.id) && s.type === 'STUDENT').map(s => s.id)
      const candidateIds = studentsPool.filter(s => selectedStudentIds.includes(s.id) && s.type === 'CANDIDATE').map(s => s.id)

      await apiPost(`/admin/hiring-requests/${selectedReqForAssign.id}/assign-students`, {
        student_ids: studentIds,
        candidate_ids: candidateIds
      })
      toast.success(`Successfully assigned ${selectedStudentIds.length} candidate(s) to requisition!`)
      setConfirmModalOpen(false)
      setAssignModalOpen(false)
      refetchReqs()
    } catch (err) {
      toast.error(err.message || 'Failed to assign students.')
    } finally {
      setAssignBusy(false)
    }
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Page Header */}
      <PageHeader
        title="Department Managers & Requisitions"
        subtitle="Manage department manager accounts, assign eligible students/candidates to position requisitions, and track manager cross-verifications."
        icon={Building2}
        actions={
          <div className="row gap-10">
            <button
              className="btn btn-secondary"
              onClick={() => setCreateReqModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, fontWeight: 700, padding: '9px 16px' }}
            >
              <ClipboardList size={16} /> Raise Requisition
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setAddDeptModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, fontWeight: 700, padding: '9px 18px', background: 'var(--brand-gradient, linear-gradient(135deg, #c5307b 0%, #9e1f5f 100%))' }}
            >
              <Plus size={16} /> Add Department Manager
            </button>
          </div>
        }
      />

      {/* Requisition & Student Assignment Flow Summary Card */}
      <div className="card mb-6" style={{ padding: '20px 24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-brand" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                REQUISITION & STUDENT ASSIGNMENT FLOW
              </span>
              <span className="muted" style={{ fontSize: 12 }}>Department Manager Operations</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text)' }}>
              Manager Hiring Requests & Student Assignment Desk
            </h2>
            <p className="muted" style={{ margin: 0, fontSize: 13, maxWidth: 640 }}>
              Department managers submit position requests. Admin/HR assigns eligible students from colleges or talent pool. Managers cross-verify and approve candidates for interview placement.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('requests')}
            className="btn-soft"
            style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, background: 'var(--brand-50)', color: 'var(--brand-600)', border: '1px solid var(--brand-200)', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ClipboardList size={16} /> View All Requisitions ({reqsList.length})
          </button>
        </div>

        <div className="grid-4 gap-12" style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <ClipboardList size={18} />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Hiring Requisitions</div>
              <strong style={{ fontSize: 15, color: 'var(--text)' }}>{totalReqs} Position Requests</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <Clock size={18} />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Pending Verification</div>
              <strong style={{ fontSize: 15, color: '#d97706' }}>{pendingReqs} Under Verification</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Manager Approved</div>
              <strong style={{ fontSize: 15, color: '#059669' }}>{reqsList.filter(r => r && r.status === 'Approved').length} Approved for Pipeline</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fdf2f8', color: '#c5307b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <Users size={18} />
            </div>
            <div>
              <div className="muted" style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Target Headcount</div>
              <strong style={{ fontSize: 15, color: 'var(--text)' }}>{totalOpenings} Openings</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '12px 16px',
          marginBottom: 24,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        {/* Modern Tab Switcher */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 12,
            flexShrink: 0
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '8px 18px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'departments' ? '#ffffff' : 'transparent',
              color: activeTab === 'departments' ? 'var(--brand-600, #c5307b)' : '#64748b',
              boxShadow: activeTab === 'departments' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <Building2 size={16} /> Department Portals ({deptsList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '8px 18px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'requests' ? '#ffffff' : 'transparent',
              color: activeTab === 'requests' ? 'var(--brand-600, #c5307b)' : '#64748b',
              boxShadow: activeTab === 'requests' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <ClipboardList size={16} /> Position Requisitions ({reqsList.length})
          </button>
        </div>

        {/* Search & Filter Controls Group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: '1 1 320px',
            justifyContent: 'flex-end',
            minWidth: 280
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'departments' ? 'departments, managers...' : 'position titles, departments...'}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 36,
                paddingRight: 14,
                borderRadius: 10,
                fontSize: 13,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
              flexShrink: 0
            }}
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Department Managers Grid */}
      {activeTab === 'departments' && (
        <>
          {filteredDepts.length === 0 ? (
            <EmptyState
              title="No Department Managers Found"
              message="Click '+ Add Department Manager' to create a new manager account."
            />
          ) : (
            <div
              className="dept-cand-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20
              }}
            >
              {filteredDepts.map((d) => {
                const theme = DEPT_THEMES[d.slug] || DEPT_THEMES.engineering
                return (
                  <div
                    key={d.id}
                    className="card hover-card"
                    style={{
                      background: '#ffffff',
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s ease, boxShadow 0.2s ease'
                    }}
                  >
                    {/* Header Banner */}
                    <div
                      style={{
                        background: theme.bg,
                        padding: '18px 22px',
                        color: '#ffffff',
                        position: 'relative'
                      }}
                    >
                      <div className="row-between mb-8">
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.8px',
                            background: 'rgba(255,255,255,0.18)',
                            padding: '3px 10px',
                            borderRadius: 20,
                            color: theme.accent,
                            textTransform: 'uppercase'
                          }}
                        >
                          CODE: {d.code || (d.name ? d.name.substring(0, 3).toUpperCase() : 'DEP')}
                        </span>
                        <div className="row gap-8">
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#6ee7b7'
                            }}
                          >
                            ● {d.status || 'Active'}
                          </span>
                          <button
                            onClick={() => openDeleteDepartmentModal(d)}
                            style={{ color: 'rgba(255,255,255,0.75)', padding: 5, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', cursor: 'pointer', borderRadius: 6 }}
                            title="Delete Department & Requisitions"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ffffff' }}>
                        {d.name || 'Department'}
                      </h2>
                    </div>

                    {/* Manager Details Body */}
                    <div style={{ padding: 20, flex: 1 }}>
                      <div
                        style={{
                          background: theme.lightBg,
                          padding: '14px 16px',
                          borderRadius: 14,
                          border: `1px solid ${theme.accent}33`,
                          marginBottom: 16
                        }}
                      >
                        <div className="row gap-12">
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              background: theme.bg,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 15,
                              flexShrink: 0
                            }}
                          >
                            {(d.manager_name || d.name || 'DM').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                              {d.manager_name || 'Department Manager'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Mail size={13} style={{ color: theme.iconColor }} />
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {d.manager_email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Credentials Display Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          marginBottom: 16,
                          fontSize: 12
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                            LOGIN CREDENTIALS
                          </span>
                          <button
                            onClick={() => handleShareCredentials(d)}
                            style={{ background: 'none', border: 'none', color: 'var(--brand-600)', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Copy size={12} /> Copy Details
                          </button>
                        </div>
                        <div style={{ color: 'var(--text)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                          <div><strong>Email:</strong> {d.manager_email}</div>
                          <div><strong>URL:</strong> /manager/{d.slug}/login</div>
                        </div>
                      </div>

                      {/* Department Hiring Stats */}
                      <div className="grid-2 gap-10">
                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Requisitions</div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                            {d.hiring_requests_count || 0}
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Target Openings</div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: theme.iconColor, marginTop: 2 }}>
                            {d.total_openings || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      style={{
                        padding: '14px 20px',
                        background: '#fafafa',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: 10
                      }}
                    >
                      <button
                        onClick={() => handleShareCredentials(d)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', borderRadius: 10, fontWeight: 700 }}
                      >
                        <Share2 size={14} /> Share Credentials
                      </button>

                      <Link
                        to={`/manager/${d.slug}/login`}
                        className="btn btn-ghost btn-sm"
                        style={{ borderRadius: 10, fontWeight: 700, color: 'var(--brand-600)' }}
                        title="Login as Manager"
                      >
                        <LogIn size={14} /> Portal
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: All Hiring Requisitions Table */}
      {activeTab === 'requests' && (
        <div className="card p-0" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {filteredReqs.length === 0 ? (
            <EmptyState
              title="No Requisitions Found"
              message="No hiring requests match your filter."
            />
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Req ID</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Position Title</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Department</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Manager</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Openings</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Budget Min-Max</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Priority</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Status</th>
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Assign Students</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReqs.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--brand-500, #c5307b)' }}>#{req.id}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{req.title}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {req.employment_type || 'Full-time'} • {req.location || 'Remote'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Badge variant="neutral">{req.department_name || 'General'}</Badge>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600 }}>
                        {req.manager_name || 'Department Manager'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 700, color: '#0284c7' }}>
                          {req.openings} Position{req.openings > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600 }}>
                        {req.budget_min || req.budget_max ? (
                          `₹${(req.budget_min || 0).toLocaleString()} - ₹${(req.budget_max || 0).toLocaleString()}`
                        ) : (
                          <span className="muted">—</span>
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
                        {req.is_frozen || req.status === 'In Progress' || (req.assigned_candidate_count || 0) > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 20,
                                background: '#ecfeff',
                                color: '#0891b2',
                                border: '1px solid #a5f3fc',
                                fontSize: 12,
                                fontWeight: 700
                              }}
                            >
                              ❄️ Frozen / Sent
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                              Assigned: {req.assigned_candidate_count || 0} / Max {req.max_allowed_candidates || (req.openings || 1) + 3}
                            </span>
                          </div>
                        ) : (
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
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {/* View Candidates Button */}
                          {((req.assigned_candidate_count || 0) > 0 || req.is_frozen) && (
                            <button
                              onClick={() => openViewCandidatesModal(req)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#f1f5f9',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="View assigned candidates"
                            >
                              <Eye size={14} style={{ color: '#0284c7' }} /> View Candidates ({req.assigned_candidate_count || 0})
                            </button>
                          )}

                          {/* Undo Assignment Button (up to 2 times) */}
                          {(req.is_frozen || (req.assigned_candidate_count || 0) > 0) && (
                            <button
                              onClick={() => handleUndoAssignment(req)}
                              disabled={undoBusy || (req.remaining_undos ?? (2 - (req.undo_count || 0))) <= 0}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: (req.remaining_undos ?? (2 - (req.undo_count || 0))) > 0 ? '#fff1f2' : '#f1f5f9',
                                color: (req.remaining_undos ?? (2 - (req.undo_count || 0))) > 0 ? '#e11d48' : '#94a3b8',
                                border: (req.remaining_undos ?? (2 - (req.undo_count || 0))) > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: (req.remaining_undos ?? (2 - (req.undo_count || 0))) > 0 ? 'pointer' : 'not-allowed',
                                opacity: (req.remaining_undos ?? (2 - (req.undo_count || 0))) > 0 ? 1 : 0.65
                              }}
                              title={(req.remaining_undos ?? (2 - (req.undo_count || 0))) > 0 ? `Undo assignment (${req.remaining_undos ?? (2 - (req.undo_count || 0))} of 2 remaining)` : 'No undos remaining (2/2 used)'}
                            >
                              <RotateCcw size={13} /> Undo ({req.remaining_undos ?? (2 - (req.undo_count || 0))}/2 left)
                            </button>
                          )}

                          {/* Assign Students / Assign Remaining Seats Button */}
                          {(!req.is_frozen || (req.remaining_seats || 0) > 0) && (
                            <button
                              onClick={() => openAssignModal(req)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '6px 14px',
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
                              }}
                            >
                              <UserPlus size={14} /> {(req.assigned_candidate_count || 0) > 0 ? `Assign Remaining (${req.remaining_seats})` : 'Assign Students'}
                            </button>
                          )}

                          {/* Delete Requisition Button */}
                          <button
                            onClick={() => openDeleteReqModal(req)}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal to Add Department Manager */}
      {addDeptModalOpen && (
        <Modal open={true} title="Add Department Manager" onClose={() => setAddDeptModalOpen(false)}>
          <form onSubmit={handleAddDepartment}>
            <div className="field">
              <label>Department Name *</label>
              <input
                type="text"
                required
                className="input"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Engineering, Finance, Operations"
              />
            </div>

            <div className="field">
              <label>Department Code (Optional)</label>
              <input
                type="text"
                className="input"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ENG, FIN, OPS"
              />
            </div>

            <div className="field">
              <label>Manager Full Name</label>
              <input
                type="text"
                className="input"
                value={deptForm.manager_name}
                onChange={(e) => setDeptForm({ ...deptForm, manager_name: e.target.value })}
                placeholder="e.g. Sarah Connor"
              />
            </div>

            <div className="field">
              <label>Manager Email *</label>
              <input
                type="email"
                required
                className="input"
                value={deptForm.manager_email}
                onChange={(e) => setDeptForm({ ...deptForm, manager_email: e.target.value })}
                placeholder="e.g. manager.engineering@mpc.com"
              />
            </div>

            <div className="field">
              <label>Initial Login Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input"
                  value={deptForm.password}
                  onChange={(e) => setDeptForm({ ...deptForm, password: e.target.value })}
                  placeholder="Password for manager"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-3)', background: 'none', border: 'none' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="row gap-8 justify-end mt-24">
              <button type="button" className="btn btn-ghost" onClick={() => setAddDeptModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Creating...' : 'Create Department Manager'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal to Create New Hiring Request */}
      {createReqModalOpen && (
        <HiringRequestCreateModal
          onClose={() => setCreateReqModalOpen(false)}
          onSuccess={() => {
            setCreateReqModalOpen(false)
            refetchReqs()
            refetchDepts()
            toast.success('Hiring request created!')
          }}
        />
      )}

      {/* Modal to Assign Students / Candidates to Hiring Request */}
      {assignModalOpen && selectedReqForAssign && (() => {
        const maxAllowed = (selectedReqForAssign.openings || 1) + 3
        return (
          <Modal
            open={true}
            title={`Assign Candidates to #${selectedReqForAssign.id} — ${selectedReqForAssign.title}`}
            onClose={() => setAssignModalOpen(false)}
            width={760}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.4, flex: 1 }}>
                  Select students from Colleges or Candidates from Talent Pool to assign to <strong>{selectedReqForAssign.title}</strong> position requested by <strong>{selectedReqForAssign.manager_name || 'Manager'}</strong>.
                </p>
                <div style={{ background: '#eef2ff', color: '#4f46e5', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <Users size={14} /> Openings: {selectedReqForAssign.openings || 1} • Max Limit: {maxAllowed} Candidates ({selectedReqForAssign.openings || 1} + 3 Extra Buffer)
                </div>
              </div>

              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" style={{ color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search students by name, email, skills, college name..."
                  className="form-control"
                  style={{ borderRadius: 10, fontSize: 13.5, background: '#f8fafc', border: '1px solid #cbd5e1' }}
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                />
              </div>
            </div>

            {poolLoading ? (
              <LoadingSpinner label="Loading available students & candidates pool..." />
            ) : (
              <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, background: '#fafafa' }}>
                {studentsPool
                  .filter(s => s && ((s.name || '').toLowerCase().includes(poolSearch.toLowerCase()) || (s.skills || []).some(k => k.toLowerCase().includes(poolSearch.toLowerCase())) || (s.college_name || '').toLowerCase().includes(poolSearch.toLowerCase())))
                  .map(st => {
                    const isSelected = selectedStudentIds.includes(st.id)
                    const toggleSelection = () => {
                      if (isSelected) {
                        setSelectedStudentIds(prev => prev.filter(id => id !== st.id))
                      } else {
                        if (selectedStudentIds.length >= maxAllowed) {
                          return toast.error(
                            `Maximum limit reached! For a position with ${selectedReqForAssign.openings || 1} opening(s), you can select up to ${maxAllowed} candidates (${selectedReqForAssign.openings || 1} opening + 3 extra buffer candidates).`
                          )
                        }
                        setSelectedStudentIds(prev => [...prev, st.id])
                      }
                    }

                    return (
                      <div
                        key={`${st.type}-${st.id}`}
                        onClick={toggleSelection}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          borderRadius: 10,
                          background: isSelected ? '#eef2ff' : '#ffffff',
                          border: isSelected ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                          marginBottom: 8,
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#4f46e5' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{st.name}</span>
                            <Badge variant={st.type === 'STUDENT' ? 'badge-blue' : 'badge-violet'}>
                              {st.college_name || (st.type === 'STUDENT' ? 'Campus Student' : 'Talent Pool')}
                            </Badge>
                            {st.cgpa && (
                              <span style={{ fontSize: 12, color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: 6 }}>
                                CGPA: {st.cgpa}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                            {st.email} • {st.degree || 'B.Tech'} ({st.branch || 'CSE'}) {st.student_code ? `• Code: ${st.student_code}` : ''}
                          </div>
                          {(st.skills || []).length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                              {st.skills.slice(0, 5).map((sk, i) => (
                                <span key={i} style={{ fontSize: 11, background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            <div className="row gap-12 justify-end mt-20" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                <strong style={{ color: selectedStudentIds.length === maxAllowed ? '#e11d48' : '#4f46e5' }}>{selectedStudentIds.length}</strong> / <strong>{maxAllowed}</strong> candidates selected (Max Limit: Openings + 3 Extra)
              </div>
              <div className="row gap-8">
                <button className="btn btn-ghost" onClick={() => setAssignModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignClick}
                  disabled={assignBusy || selectedStudentIds.length === 0}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: 13.5
                  }}
                >
                  {assignBusy ? 'Assigning Candidates...' : `Assign ${selectedStudentIds.length} Selected Candidate(s)`}
                </button>
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* Confirmation Popup Modal */}
      {confirmModalOpen && selectedReqForAssign && (() => {
        const maxAllowed = (selectedReqForAssign.openings || 1) + 3
        return (
          <Modal
            open={true}
            title="Confirm Candidate Assignment"
            onClose={() => setConfirmModalOpen(false)}
            width={500}
          >
            <div style={{ padding: '8px 0', textAlign: 'center' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <UserCheck size={32} />
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px 0' }}>
                Confirm Candidate Assignment?
              </h3>

              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Are you sure you want to assign <strong>{selectedStudentIds.length} candidate(s)</strong> (within max limit of {maxAllowed} for {selectedReqForAssign.openings || 1} opening) to requisition <strong>#{selectedReqForAssign.id} — {selectedReqForAssign.title}</strong> for manager confirmation?
              </p>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 24, textAlign: 'left', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="muted">Position:</span>
                  <strong>{selectedReqForAssign.title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="muted">Department:</span>
                  <strong>{selectedReqForAssign.department_name || 'General'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Selected Candidates:</span>
                  <strong style={{ color: 'var(--brand-600)' }}>{selectedStudentIds.length} of {maxAllowed} Max Allowed</strong>
                </div>
              </div>

              <div className="row gap-12 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={assignBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={executeAssignStudents}
                  disabled={assignBusy}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    padding: '10px 22px',
                    fontWeight: 700,
                    fontSize: 13.5
                  }}
                >
                  {assignBusy ? 'Assigning...' : 'Yes, Confirm Assignment'}
                </button>
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* Modal to View Assigned Candidates */}
      {viewCandModalOpen && selectedReqForView && (
        <Modal
          open={true}
          title={`Assigned Candidates — #${selectedReqForView.id} ${selectedReqForView.title}`}
          onClose={() => setViewCandModalOpen(false)}
          width={760}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12, background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {selectedReqForView.title} ({selectedReqForView.department_name || 'General'})
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Requested by: <strong>{selectedReqForView.manager_name || 'Manager'}</strong> • Openings: <strong>{selectedReqForView.openings || 1}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '4px 10px', borderRadius: 20, border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Users size={13} /> Max Quota: {selectedReqForView.max_allowed_candidates || (selectedReqForView.openings || 1) + 3} (Openings + 3 Buffer)
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
                  Assigned: <strong>{viewCandidatesList.length}</strong> • Remaining Seats: <strong>{Math.max(0, (selectedReqForView.max_allowed_candidates || (selectedReqForView.openings || 1) + 3) - viewCandidatesList.length)}</strong>
                </div>
              </div>
            </div>

            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Filter assigned candidates by name, email, college, branch..."
                className="form-control"
                style={{ borderRadius: 10, fontSize: 13.5, background: '#ffffff', border: '1px solid #cbd5e1' }}
                value={viewCandSearch}
                onChange={(e) => setViewCandSearch(e.target.value)}
              />
            </div>
          </div>

          {viewCandLoading ? (
            <LoadingSpinner label="Loading assigned candidates..." />
          ) : viewCandidatesList.length === 0 ? (
            <EmptyState
              title="No Candidates Assigned Yet"
              message="No candidates or campus students have been assigned to this requisition."
            />
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, background: '#fafafa' }}>
              {viewCandidatesList
                .filter(c => (c.name || '').toLowerCase().includes(viewCandSearch.toLowerCase()) || (c.email || '').toLowerCase().includes(viewCandSearch.toLowerCase()) || (c.college_name || '').toLowerCase().includes(viewCandSearch.toLowerCase()))
                .map((cand) => (
                  <div
                    key={cand.application_id || cand.candidate_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      marginBottom: 8
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{cand.name}</span>
                        <Badge variant="badge-blue">{cand.college_name || 'Campus Student'}</Badge>
                        {cand.cgpa && (
                          <span style={{ fontSize: 12, color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '2px 8px', borderRadius: 6 }}>
                            CGPA: {cand.cgpa}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
                        {cand.email} • {cand.degree || 'B.Tech'} ({cand.branch || 'CSE'})
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <Badge variant="success">{cand.stage || 'Applied'}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="row gap-12 justify-between mt-20" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => handleUndoAssignment(selectedReqForView)}
              disabled={undoBusy || (selectedReqForView.remaining_undos ?? (2 - (selectedReqForView.undo_count || 0))) <= 0}
              className="btn btn-ghost"
              style={{
                color: (selectedReqForView.remaining_undos ?? (2 - (selectedReqForView.undo_count || 0))) > 0 ? '#e11d48' : '#94a3b8',
                fontWeight: 700,
                fontSize: 13
              }}
            >
              <RotateCcw size={14} /> Undo Assignment ({selectedReqForView.remaining_undos ?? (2 - (selectedReqForView.undo_count || 0))}/2 left)
            </button>

            <button className="btn btn-primary" onClick={() => setViewCandModalOpen(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Department Confirmation Popup Modal */}
      {deleteDeptModalOpen && deletingDept && (
        <Modal open={true} title="Confirm Department & Requisitions Deletion" onClose={() => setDeleteDeptModalOpen(false)}>
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff1f2', border: '1px solid #fecdd3', padding: 16, borderRadius: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ffe4e6', color: '#e11d48', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: '#9f1239' }}>
                  Do you really want to delete department '{deletingDept.name}'?
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#be123c', lineHeight: 1.4 }}>
                  This action will permanently delete the <strong>{deletingDept.name}</strong> department manager account, all position requisitions, linked jobs, and candidate mappings.
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 10, fontSize: 13, color: '#334155' }}>
              <div><strong>Department Name:</strong> {deletingDept.name} ({deletingDept.code || 'DEP'})</div>
              <div><strong>Manager:</strong> {deletingDept.manager_name || 'Department Manager'}</div>
              <div><strong>Manager Email:</strong> {deletingDept.manager_email}</div>
            </div>

            <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteDeptModalOpen(false)} style={{ fontWeight: 700 }}>
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteDeptBusy}
                onClick={handleConfirmDeleteDept}
                className="btn"
                style={{ background: '#e11d48', color: '#ffffff', border: 'none', fontWeight: 700, borderRadius: 8, padding: '9px 18px' }}
              >
                {deleteDeptBusy ? 'Deleting Everything...' : 'Yes, Delete Department & Requisitions'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Requisition Confirmation Popup Modal */}
      {deleteReqModalOpen && deletingReq && (
        <Modal open={true} title="Confirm Requisition Deletion" onClose={() => setDeleteReqModalOpen(false)}>
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff1f2', border: '1px solid #fecdd3', padding: 16, borderRadius: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ffe4e6', color: '#e11d48', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: '#9f1239' }}>
                  Do you really want to delete requisition #{deletingReq.id}?
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#be123c', lineHeight: 1.4 }}>
                  Position Title: <strong>{deletingReq.title}</strong> ({deletingReq.openings} openings)
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 10, fontSize: 13, color: '#334155' }}>
              <div><strong>Department:</strong> {deletingReq.department_name}</div>
              <div><strong>Priority:</strong> {deletingReq.priority || 'Medium'}</div>
              <div><strong>Assigned Candidates:</strong> {deletingReq.assigned_candidate_count || 0} students</div>
            </div>

            <div className="flex" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteReqModalOpen(false)} style={{ fontWeight: 700 }}>
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteReqBusy}
                onClick={handleConfirmDeleteReq}
                className="btn"
                style={{ background: '#e11d48', color: '#ffffff', border: 'none', fontWeight: 700, borderRadius: 8, padding: '9px 18px' }}
              >
                {deleteReqBusy ? 'Deleting...' : 'Yes, Delete Requisition'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Users, Briefcase, Plus, Search, ExternalLink,
  ClipboardList, UserPlus, Shield, ChevronRight, CheckCircle2,
  Clock, AlertCircle, ArrowUpRight, LogIn, Sparkles, Filter,
  Mail, Award, UserCheck, Layers, TrendingUp, Share2, Copy,
  Trash2, Key, Lock, Eye, EyeOff
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

  const loading = deptsLoading || reqsLoading
  if (loading) return <LoadingSpinner full />
  if (deptsErr) return <ErrorState error={deptsErr} retry={refetchDepts} />

  const deptsList = departments || []
  const reqsList = requests || []

  // Stats calculation
  const totalDepts = deptsList.length
  const totalReqs = reqsList.length
  const pendingReqs = reqsList.filter(r => r.status === 'Pending' || r.status === 'In Progress').length
  const totalOpenings = reqsList.reduce((acc, r) => acc + (r.openings || 1), 0)

  // Filtered lists
  const filteredDepts = deptsList.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.manager_name && d.manager_name.toLowerCase().includes(search.toLowerCase())) ||
      (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredReqs = reqsList.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.department_name && r.department_name.toLowerCase().includes(search.toLowerCase())) ||
      (r.manager_name && r.manager_name.toLowerCase().includes(search.toLowerCase()))
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

  // Handle Delete Department
  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove '${name}' department manager?`)) return
    try {
      await apiDelete(`/manager/departments/${id}`)
      toast.success(`Department '${name}' removed.`)
      refetchDepts()
    } catch (err) {
      toast.error(err.message || 'Failed to delete department.')
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

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Executive Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #831f51 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: 24,
          boxShadow: '0 16px 36px -10px rgba(49, 46, 129, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="row-between wrap gap-16" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div className="row gap-8 mb-6" style={{ opacity: 0.9 }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                Executive Workspace
              </span>
              <span style={{ fontSize: 13, opacity: 0.8 }}>MPC Cloud Consulting</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
              Department Managers & Requisitions
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, opacity: 0.85, maxWidth: 620 }}>
              Add department managers, manage login credentials, and track recruitment requisitions across teams.
            </p>
          </div>

          <div>
            <button
              className="btn"
              onClick={() => setAddDeptModalOpen(true)}
              style={{
                background: 'var(--brand-gradient, linear-gradient(135deg, #c5307b 0%, #9e1f5f 100%))',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 8px 20px rgba(197, 48, 123, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Plus size={18} /> Add Department Manager
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid-4 gap-16 mb-24">
        <StatCard
          label="Departments"
          value={totalDepts}
          icon={Building2}
          tone="brand"
          sub="Manager portals configured"
        />
        <StatCard
          label="Total Requisitions"
          value={totalReqs}
          icon={ClipboardList}
          tone="blue"
          sub="Across all departments"
        />
        <StatCard
          label="Active / Pending"
          value={pendingReqs}
          icon={Clock}
          tone="amber"
          sub="In candidate verification"
        />
        <StatCard
          label="Total Openings"
          value={totalOpenings}
          icon={Users}
          tone="green"
          sub="Headcount target requested"
        />
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div
        className="card mb-24 p-16 row-between wrap gap-16"
        style={{
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Sleek Tab Pills */}
        <div className="row gap-8" style={{ background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === 'departments' ? '#ffffff' : 'transparent',
              color: activeTab === 'departments' ? 'var(--brand-500, #c5307b)' : 'var(--text-2)',
              boxShadow: activeTab === 'departments' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Building2 size={15} /> Department Managers ({deptsList.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === 'requests' ? '#ffffff' : 'transparent',
              color: activeTab === 'requests' ? 'var(--brand-500, #c5307b)' : 'var(--text-2)',
              boxShadow: activeTab === 'requests' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ClipboardList size={15} /> All Requisitions ({reqsList.length})
          </button>
        </div>

        {/* Search & Filter Inputs */}
        <div className="row gap-12" style={{ flex: 1, justifyContent: 'flex-end', maxWidth: 460 }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" style={{ color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'departments' ? 'departments, managers...' : 'position titles, departments...'}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{
                borderRadius: 8,
                fontSize: 13.5,
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
            style={{
              width: 130,
              borderRadius: 8,
              fontSize: 13,
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
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
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {/* Header Banner */}
                    <div
                      style={{
                        background: theme.bg,
                        padding: '16px 20px',
                        color: '#ffffff',
                        position: 'relative'
                      }}
                    >
                      <div className="row-between mb-6">
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.8px',
                            background: 'rgba(255,255,255,0.18)',
                            padding: '3px 9px',
                            borderRadius: 10,
                            color: theme.accent,
                            textTransform: 'uppercase'
                          }}
                        >
                          CODE: {d.code || d.name.substring(0, 3).toUpperCase()}
                        </span>
                        <div className="row gap-6">
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#6ee7b7'
                            }}
                          >
                            ● {d.status || 'Active'}
                          </span>
                          <button
                            onClick={() => handleDeleteDepartment(d.id, d.name)}
                            style={{ color: 'rgba(255,255,255,0.6)', padding: 2, background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Remove Department"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#ffffff' }}>
                        {d.name}
                      </h2>
                    </div>

                    {/* Manager Details Body */}
                    <div style={{ padding: 18, flex: 1 }}>
                      <div
                        style={{
                          background: theme.lightBg,
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: `1px solid ${theme.accent}33`,
                          marginBottom: 14
                        }}
                      >
                        <div className="row gap-10">
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: theme.bg,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 14,
                              flexShrink: 0
                            }}
                          >
                            {(d.manager_name || 'DM').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
                              {d.manager_name || 'Department Manager'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Mail size={12} style={{ color: theme.iconColor }} />
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
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          marginBottom: 14,
                          fontSize: 12
                        }}
                      >
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Login Credentials
                        </div>
                        <div style={{ color: 'var(--text)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                          <div><strong>Email:</strong> {d.manager_email}</div>
                          <div><strong>URL:</strong> /manager/{d.slug}/login</div>
                        </div>
                      </div>

                      {/* Department Hiring Stats */}
                      <div className="grid-2 gap-10">
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Requisitions</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                            {d.hiring_requests_count || 0}
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Target Openings</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: theme.iconColor, marginTop: 2 }}>
                            {d.total_openings || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div
                      style={{
                        padding: '12px 18px',
                        background: '#fafafa',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        gap: 10
                      }}
                    >
                      <button
                        onClick={() => handleShareCredentials(d)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', borderRadius: 8 }}
                      >
                        <Share2 size={14} /> Share Credentials
                      </button>

                      <Link
                        to={`/manager/${d.slug}/login`}
                        className="btn btn-ghost btn-sm"
                        style={{ borderRadius: 8 }}
                        title="Login as Manager"
                      >
                        <LogIn size={14} /> Login
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
                          `$${(req.budget_min || 0).toLocaleString()} - $${(req.budget_max || 0).toLocaleString()}`
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
                        <Badge
                          variant={
                            req.status === 'Approved' || req.status === 'In Progress'
                              ? 'success'
                              : req.status === 'Pending'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {req.status}
                        </Badge>
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
    </div>
  )
}

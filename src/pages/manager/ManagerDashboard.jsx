import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ClipboardList, Users, UserCheck, CheckCircle2, Plus, Clock, TrendingUp,
  AlertCircle, ChevronRight, FileText, CalendarClock, Award, Building2, KanbanSquare
} from 'lucide-react'
import { apiGet } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner, Badge, StatCard } from '../../components/UI'
import HiringRequestCreateModal from './HiringRequestCreateModal'

export default function ManagerDashboard() {
  const { deptSlug } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const { user } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [hiringRequests, setHiringRequests] = useState([])
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const deptName = user?.department_name || slug.toUpperCase()

  const loadData = async () => {
    setLoading(true)
    try {
      const [sData, reqsData] = await Promise.all([
        apiGet(`/manager/dashboard-stats?dept_slug=${slug}`),
        apiGet(`/manager/hiring-requests?dept_slug=${slug}`)
      ])
      setStats(sData || {})
      setHiringRequests(reqsData || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load department metrics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [slug])

  if (loading && !stats) return <LoadingSpinner full label={`Loading ${deptName} Department Dashboard...`} />

  return (
    <div style={{ paddingBottom: 50 }}>
      {/* Top Banner */}
      <div
        className="dept-mgr-hero mb-24"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #831f51 100%)',
          borderRadius: 18,
          padding: '24px 30px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 20, fontSize: 11.5, fontWeight: 700, marginBottom: 10, letterSpacing: '0.5px' }}>
            <Building2 size={14} color="#38bdf8" />
            <span>{deptName} DEPARTMENT PORTAL</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.3px', color: '#ffffff' }}>
            Welcome, {user?.name || 'Department Manager'}
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#e0e7ff', maxWidth: 580, lineHeight: 1.5 }}>
            Submit position requisitions, cross-verify assigned candidate submissions, and track candidate pipeline progression.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn dept-mgr-hero-btn"
            style={{
              background: '#ffffff',
              color: '#312e81',
              borderRadius: 12,
              padding: '12px 22px',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={18} color="#312e81" />
            <span>Raise Hiring Request</span>
          </button>

          <Link
            to={`/manager/${slug}/pipeline`}
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none'
            }}
          >
            <KanbanSquare size={18} />
            <span>Track Pipeline</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-4 gap-16 mb-24">
        <StatCard
          label="Hiring Requisitions"
          value={stats?.total_requests ?? hiringRequests.length}
          icon={ClipboardList}
          tone="brand"
          sub="Total submitted position requests"
        />

        <StatCard
          label="Open Positions"
          value={stats?.total_openings ?? hiringRequests.reduce((a, r) => a + (r.openings || 1), 0)}
          icon={Users}
          tone="blue"
          sub="Requested headcount target"
        />

        <StatCard
          label="Pending Verification"
          value={stats?.pending_requests ?? hiringRequests.filter(r => r.status === 'Pending').length}
          icon={Clock}
          tone="amber"
          sub="Awaiting candidate review"
        />

        <StatCard
          label="Candidates Sourced"
          value={stats?.candidates_sourced ?? 0}
          icon={UserCheck}
          tone="green"
          sub="Mapped to department positions"
        />
      </div>

      {/* Requisitions List Table */}
      <div className="card p-0" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Active Department Requisitions</h2>
            <div className="muted" style={{ fontSize: 13 }}>Requisitions submitted for {deptName}</div>
          </div>
          <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={14} /> Raise Request
          </button>
        </div>

        {hiringRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc' }}>
            <ClipboardList size={38} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No Hiring Requests Submitted Yet</h3>
            <p className="muted" style={{ margin: '6px 0 16px 0', fontSize: 13 }}>
              Raise position requirements to request candidate sourcing from recruitment HR.
            </p>
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Submit First Hiring Request
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Position Title</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Openings</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Required Skills</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Assigned Recruiter</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hiringRequests.map((req) => {
                  const skillsList = Array.isArray(req.required_skills)
                    ? req.required_skills
                    : typeof req.required_skills === 'string'
                    ? req.required_skills.replace(/,/g, ';').split(';').map(s => s.trim()).filter(Boolean)
                    : []

                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{req.title}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                          {req.location || 'Remote'} • {req.employment_type || 'Full-time'} • {req.experience_min || 0}+ yrs exp
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--brand-500)' }}>{req.openings}</span> Position{req.openings > 1 ? 's' : ''}
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
                        <div className="row gap-4 wrap">
                          {skillsList.slice(0, 3).map((s, idx) => (
                            <span key={idx} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', background: '#f1f5f9', borderRadius: 4 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600 }}>
                        {req.assigned_recruiter_name || 'Recruitment Team'}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Create Hiring Request */}
      {createModalOpen && (
        <HiringRequestCreateModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false)
            loadData()
            toast.success('Hiring request created successfully!')
          }}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { Award, Download, CheckCircle2, AlertTriangle, Clock, BookOpen, Building2 } from 'lucide-react'
import api, { apiGet } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, StatCard, Badge } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

export default function TrainingCompliance() {
  const toast = useToast()
  const { data, loading, error, refetch } = useFetch('/training/compliance')
  const [exporting, setExporting] = useState(false)

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await api.get('/training/compliance/export.csv', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `training_compliance_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Compliance CSV exported successfully')
    } catch (e) {
      toast.error('Failed to export compliance CSV')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const stats = data?.stats || { total_assignments: 0, completed: 0, overdue: 0, in_progress: 0, completion_rate: 0 }
  const deptStats = data?.by_department || []
  const courseStats = data?.by_course || []
  const overdueList = data?.overdue_assignments || []

  return (
    <div>
      <PageHeader
        title="Training Compliance"
        subtitle="Workforce training completion rate metrics, department breakdown, and overdue tracking."
        icon={Award}
        actions={
          <button className="btn-primary flex" style={{ gap: 6 }} onClick={exportCsv} disabled={exporting}>
            <Download size={16} /> <span>{exporting ? 'Exporting…' : 'Export Compliance CSV'}</span>
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid-stats mb-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          icon={CheckCircle2}
          label="Completion Rate"
          value={`${stats.completion_rate}%`}
          sub={`${stats.completed} of ${stats.total_assignments} completed`}
          tone="green"
        />
        <StatCard
          icon={BookOpen}
          label="Total Assignments"
          value={stats.total_assignments}
          sub={`${stats.in_progress} currently in progress`}
          tone="brand"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Assignments"
          value={stats.overdue}
          sub="Requires HR escalation"
          tone="red"
        />
        <StatCard
          icon={Clock}
          label="Pending / Assigned"
          value={stats.assigned}
          sub="Awaiting employee start"
          tone="amber"
        />
      </div>

      {/* Completion by Department */}
      <div className="card mb-6" style={{ padding: 24 }}>
        <div className="flex row-between mb-4" style={{ alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
            <Building2 size={20} color="var(--brand-500)" /> Department Completion Breakdown
          </h3>
        </div>

        {deptStats.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Department Metrics Yet"
            message="No department training metrics available for the active compliance cycle."
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Assigned</th>
                  <th>Completed</th>
                  <th>Overdue</th>
                  <th>Completion Progress</th>
                </tr>
              </thead>
              <tbody>
                {deptStats.map((d) => (
                  <tr key={d.department}>
                    <td><strong>{d.department}</strong></td>
                    <td>{d.total}</td>
                    <td>{d.completed}</td>
                    <td>
                      {d.overdue > 0 ? (
                        <Badge variant="badge-red">{d.overdue} Overdue</Badge>
                      ) : (
                        <span style={{ color: 'var(--text-3)' }}>0</span>
                      )}
                    </td>
                    <td style={{ minWidth: 200 }}>
                      <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
                        <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${d.completion_pct}%`, borderRadius: 999,
                            background: d.completion_pct >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : d.completion_pct >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)' }}>{d.completion_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completion by Course */}
      <div className="card mb-6" style={{ padding: 24 }}>
        <div className="flex row-between mb-4" style={{ alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
            <BookOpen size={20} color="var(--brand-500)" /> Course Completion Breakdown
          </h3>
        </div>

        {courseStats.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Course Completion Data"
            message="No active course completion records found for this period."
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Total Assigned</th>
                  <th>Completed</th>
                  <th>Overdue</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {courseStats.map((c) => (
                  <tr key={c.course_title}>
                    <td><strong>{c.course_title}</strong></td>
                    <td>{c.total}</td>
                    <td>{c.completed}</td>
                    <td>
                      {c.overdue > 0 ? (
                        <Badge variant="badge-red">{c.overdue} Overdue</Badge>
                      ) : (
                        <span style={{ color: 'var(--text-3)' }}>0</span>
                      )}
                    </td>
                    <td style={{ minWidth: 200 }}>
                      <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
                        <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${c.completion_pct}%`, borderRadius: 999,
                            background: c.completion_pct >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : c.completion_pct >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)' }}>{c.completion_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue Assignments List */}
      <div className="card" style={{ padding: 24 }}>
        <div className="flex row-between mb-4" style={{ alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--red-600)' }}>
            <AlertTriangle size={20} /> Overdue Assignments ({overdueList.length})
          </h3>
        </div>

        {overdueList.length === 0 ? (
          <div style={{
            padding: '24px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            borderRadius: 12, border: '1px solid #a7f3d0', color: '#047857', fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            <CheckCircle2 size={20} color="#059669" />
            <span>Awesome! All employees are up to date with their training assignments. No overdue items.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Course Title</th>
                  <th>Cycle</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overdueList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{item.employee_name}</strong>
                      <div className="muted" style={{ fontSize: 12 }}>{item.employee_email}</div>
                    </td>
                    <td>{item.department || '—'}</td>
                    <td><strong>{item.course_title}</strong></td>
                    <td><span className="chip">{item.cycle}</span></td>
                    <td style={{ color: 'var(--red-600)', fontWeight: 700 }}>
                      {item.due_date ? item.due_date.slice(0, 10) : '—'}
                    </td>
                    <td>
                      <Badge variant="badge-red" dot>Overdue</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

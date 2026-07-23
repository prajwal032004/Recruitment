import { useState } from 'react'
import {
  Award, BookOpen, Sliders, Building2, Download, Plus, Search, Edit3,
  Trash2, HelpCircle, Play, CheckCircle2, AlertTriangle, Clock, Zap, Video,
  Eye, UserPlus, X, Check, ExternalLink, ShieldCheck, UserCheck
} from 'lucide-react'
import api, { apiGet, apiPost, apiPut } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, StatCard, Badge, Modal, Avatar } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

function formatDurationText(mins) {
  const m = Number(mins) || 0
  if (m <= 0) return 'Duration pending'
  if (m < 1) return `${Math.round(m * 60)} secs`
  if (m < 60) return `${m} mins`
  const hrs = Math.floor(m / 60)
  const remMins = m % 60
  return remMins > 0 ? `${hrs} hr ${remMins} mins` : `${hrs} hr${hrs > 1 ? 's' : ''}`
}

const BLANK_COURSE = {
  title: '',
  category: 'Security',
  video_url: '',
  duration_minutes: 30,
  description: '',
  pass_mark: 70,
  recurrence: 'Quarterly',
  is_active: true
}

const BLANK_QUESTION = {
  question: '',
  options: ['', '', '', ''],
  correct_option: 0,
  marks: 1
}

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

// Convert YouTube or direct video URLs into embeddable src
function getEmbedUrl(url) {
  if (!url) return null
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${id}?autoplay=1`
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${id}?autoplay=1`
  }
  return url
}

export default function TrainingHub() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('compliance') // 'compliance' | 'courses' | 'rules'

  // Data fetches
  const { data: compData, loading: compLoading, error: compError, refetch: refetchComp } = useFetch('/training/compliance')
  const { data: employeesData } = useFetch('/employees?per_page=100')
  
  const [courseQ, setCourseQ] = useState('')
  const [courseCat, setCourseCat] = useState('')
  const { data: rawCourses, loading: coursesLoading, refetch: refetchCourses } = useFetch(`/training/courses?search=${encodeURIComponent(courseQ)}&category=${encodeURIComponent(courseCat)}`, [courseQ, courseCat])

  const { data: rawRules, loading: rulesLoading, refetch: refetchRules } = useFetch('/training/rules')

  const coursesData = Array.isArray(rawCourses) ? rawCourses : (rawCourses?.items || [])
  const rulesData = Array.isArray(rawRules) ? rawRules : (rawRules?.items || [])
  const employeeList = employeesData?.items || []

  // Export state
  const [exporting, setExporting] = useState(false)

  // In-App Video Player Modal state
  const [videoModal, setVideoModal] = useState(false)
  const [playingCourse, setPlayingCourse] = useState(null)

  // Manual Assignment Modal state
  const [assignModal, setAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ employee_id: '', course_id: '', due_days: 14 })

  // Employee Eye Progress Modal state
  const [eyeModal, setEyeModal] = useState(false)
  const [selectedProgress, setSelectedProgress] = useState(null)

  // Course Modal state
  const [courseModal, setCourseModal] = useState(false)
  const [courseForm, setCourseForm] = useState(BLANK_COURSE)
  const [editCourseId, setEditCourseId] = useState(null)

  // Question Bank Modal state
  const [qBankModal, setQBankModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)
  const [qForm, setQForm] = useState(BLANK_QUESTION)
  const [editQId, setEditQId] = useState(null)
  const [qFormOpen, setQFormOpen] = useState(false)

  // Rule Modal state
  const [ruleModal, setRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState(BLANK_RULE)
  const [editRuleId, setEditRuleId] = useState(null)

  // Engine Run state
  const [running, setRunning] = useState(false)
  const [runResultModal, setRunResultModal] = useState(false)
  const [runResult, setRunResult] = useState(null)

  const [busy, setBusy] = useState(false)

  const setC = (k) => (e) => setCourseForm({ ...courseForm, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  // --- Actions ---

  const openVideoPlayer = (course) => {
    setPlayingCourse(course)
    setVideoModal(true)
  }

  const openAssignModal = (prefillCourseId = '') => {
    setAssignForm({
      employee_id: employeeList.length > 0 ? employeeList[0].id : '',
      course_id: prefillCourseId || (coursesData.length > 0 ? coursesData[0].id : ''),
      due_days: 14
    })
    setAssignModal(true)
  }

  const submitManualAssign = async () => {
    if (!assignForm.employee_id || !assignForm.course_id) {
      return toast.error('Please select both an employee and a course.')
    }
    setBusy(true)
    try {
      const res = await apiPost('/training/assign', assignForm)
      toast.success(res.message || 'Course assigned successfully!')
      setAssignModal(false)
      refetchComp()
    } catch (e) {
      toast.error(e.message || 'Failed to assign course')
    } finally {
      setBusy(false)
    }
  }

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

  // Course Handlers
  const openAddCourse = () => {
    setEditCourseId(null)
    setCourseForm(BLANK_COURSE)
    setCourseModal(true)
  }

  const openEditCourse = (c) => {
    setEditCourseId(c.id)
    setCourseForm({
      title: c.title || '',
      category: c.category || 'Security',
      video_url: c.video_url || '',
      duration_minutes: c.duration_minutes || 30,
      description: c.description || '',
      pass_mark: c.pass_mark || 70,
      recurrence: c.recurrence || 'Quarterly',
      is_active: c.is_active ?? true
    })
    setCourseModal(true)
  }

  const saveCourse = async () => {
    if (!courseForm.title) return toast.error('Course title is required.')
    setBusy(true)
    try {
      if (editCourseId) {
        await apiPut(`/training/courses/${editCourseId}`, courseForm)
        toast.success('Course updated')
      } else {
        await apiPost('/training/courses', courseForm)
        toast.success('Course created')
      }
      setCourseModal(false)
      refetchCourses()
    } catch (e) {
      toast.error(e.message || 'Failed to save course')
    } finally {
      setBusy(false)
    }
  }

  const deleteCourse = async (cid) => {
    if (!window.confirm('Delete this training course and all associated questions?')) return
    try {
      await api.delete(`/training/courses/${cid}`)
      toast.success('Course deleted')
      refetchCourses()
    } catch (e) {
      toast.error(e.message || 'Failed to delete course')
    }
  }

  // Question Handlers
  const openQBank = async (course) => {
    setSelectedCourse(course)
    setQBankModal(true)
    setQFormOpen(false)
    setQLoading(true)
    try {
      const res = await apiGet(`/training/courses/${course.id}/questions`)
      setQuestions(Array.isArray(res) ? res : (res?.data || []))
    } catch (e) {
      toast.error('Failed to load exam questions')
    } finally {
      setQLoading(false)
    }
  }

  const openAddQ = () => {
    setEditQId(null)
    setQForm(BLANK_QUESTION)
    setQFormOpen(true)
  }

  const openEditQ = (qItem) => {
    setEditQId(qItem.id)
    setQForm({
      question: qItem.question || '',
      options: [...(qItem.options || ['', '', '', ''])],
      correct_option: qItem.correct_option ?? 0,
      marks: qItem.marks || 1
    })
    setQFormOpen(true)
  }

  const saveQuestion = async () => {
    if (!qForm.question) return toast.error('Question text is required.')
    if (qForm.options.some((o) => !o.trim())) return toast.error('All 4 options must be filled.')
    setBusy(true)
    try {
      if (editQId) {
        await apiPut(`/training/questions/${editQId}`, qForm)
        toast.success('Question updated')
      } else {
        await apiPost(`/training/courses/${selectedCourse.id}/questions`, qForm)
        toast.success('Question added')
      }
      setQFormOpen(false)
      const res = await apiGet(`/training/courses/${selectedCourse.id}/questions`)
      setQuestions(Array.isArray(res) ? res : (res?.data || []))
      refetchCourses()
    } catch (e) {
      toast.error(e.message || 'Failed to save question')
    } finally {
      setBusy(false)
    }
  }

  const deleteQuestion = async (qid) => {
    if (!window.confirm('Delete this question?')) return
    try {
      await api.delete(`/training/questions/${qid}`)
      toast.success('Question deleted')
      const res = await apiGet(`/training/courses/${selectedCourse.id}/questions`)
      setQuestions(Array.isArray(res) ? res : (res?.data || []))
      refetchCourses()
    } catch (e) {
      toast.error('Failed to delete question')
    }
  }

  // Rule Handlers
  const openAddRule = () => {
    setEditRuleId(null)
    setRuleForm({
      ...BLANK_RULE,
      course_id: coursesData && coursesData.length ? coursesData[0].id : ''
    })
    setRuleModal(true)
  }

  const openEditRule = (r) => {
    setEditRuleId(r.id)
    setRuleForm({
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
    if (!ruleForm.name || !ruleForm.course_id) {
      return toast.error('Rule name and course selection are required.')
    }
    setBusy(true)
    try {
      if (editRuleId) {
        await apiPut(`/training/rules/${editRuleId}`, ruleForm)
        toast.success('Assignment rule updated')
      } else {
        await apiPost('/training/rules', ruleForm)
        toast.success('Assignment rule created')
      }
      setRuleModal(false)
      refetchRules()
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
      refetchRules()
    } catch (e) {
      toast.error(e.message || 'Failed to delete rule')
    }
  }

  const runEngine = async () => {
    setRunning(true)
    try {
      const res = await apiPost('/training/rules/run', {})
      setRunResult(res)
      setRunResultModal(true)
      toast.success(res.message || 'Rules executed for current quarter cycle!')
      refetchComp()
      refetchRules()
    } catch (e) {
      toast.error(e.message || 'Failed to run assignment engine')
    } finally {
      setRunning(false)
    }
  }

  const stats = compData?.stats || { total_assignments: 0, completed: 0, overdue: 0, in_progress: 0, completion_rate: 0 }
  const deptStats = compData?.by_department || []
  const courseStats = compData?.by_course || []
  const overdueList = compData?.overdue_assignments || []

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header with spacious bottom margin */}
      <div style={{ marginBottom: 32 }}>
        <PageHeader
          title="Training & Compliance Hub"
          subtitle="Unified platform to create courses, watch videos in-app, assign training, and track employee progress."
          icon={Award}
          actions={
            <div className="flex wrap" style={{ gap: 10, alignItems: 'center' }}>
              <button
                className="btn-primary flex"
                style={{ gap: 8, padding: '10px 18px', borderRadius: 12, fontWeight: 700 }}
                onClick={() => openAssignModal()}
              >
                <UserPlus size={16} /> <span>Assign Course to Employee</span>
              </button>

              <button className="btn-soft flex" style={{ gap: 6, padding: '10px 14px', borderRadius: 12 }} onClick={openAddCourse}>
                <Plus size={16} /> <span>New Course</span>
              </button>

              <button className="btn-soft flex" style={{ gap: 6, padding: '10px 14px', borderRadius: 12 }} onClick={openAddRule}>
                <Sliders size={16} /> <span>New Rule</span>
              </button>

              <button className="btn-ghost flex" style={{ gap: 6, padding: '10px 14px' }} onClick={runEngine} disabled={running}>
                <Play size={16} color="var(--brand-500)" />
                <span>{running ? 'Running Engine…' : 'Run Rule Engine'}</span>
              </button>

              <button className="btn-ghost flex" style={{ gap: 6, padding: '10px 14px' }} onClick={exportCsv} disabled={exporting}>
                <Download size={16} /> <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Floating Glassmorphism Tab Bar with generous padding */}
      <div
        className="card mb-8"
        style={{
          padding: 8,
          display: 'flex',
          gap: 10,
          background: 'var(--surface)',
          borderRadius: 16,
          overflowX: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setActiveTab('compliance')}
          className="btn flex"
          style={{
            flex: 1,
            minWidth: 180,
            justifyContent: 'center',
            gap: 10,
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            background: activeTab === 'compliance' ? 'var(--brand-gradient)' : 'transparent',
            color: activeTab === 'compliance' ? '#fff' : 'var(--text-2)',
            boxShadow: activeTab === 'compliance' ? '0 6px 20px rgba(197, 48, 123, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Award size={19} />
          <span>Compliance & Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className="btn flex"
          style={{
            flex: 1,
            minWidth: 180,
            justify: 'center',
            gap: 10,
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            background: activeTab === 'courses' ? 'var(--brand-gradient)' : 'transparent',
            color: activeTab === 'courses' ? '#fff' : 'var(--text-2)',
            boxShadow: activeTab === 'courses' ? '0 6px 20px rgba(197, 48, 123, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <BookOpen size={19} />
          <span>Training Catalogue ({coursesData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className="btn flex"
          style={{
            flex: 1,
            minWidth: 180,
            justify: 'center',
            gap: 10,
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            background: activeTab === 'rules' ? 'var(--brand-gradient)' : 'transparent',
            color: activeTab === 'rules' ? '#fff' : 'var(--text-2)',
            boxShadow: activeTab === 'rules' ? '0 6px 20px rgba(197, 48, 123, 0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Sliders size={19} />
          <span>Assignment Rules ({rulesData.length})</span>
        </button>
      </div>

      {/* TAB 1: COMPLIANCE DASHBOARD */}
      {activeTab === 'compliance' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {compLoading ? (
            <LoadingSpinner />
          ) : compError ? (
            <ErrorState message={compError} onRetry={refetchComp} />
          ) : (
            <>
              {/* Spacious Stats Row */}
              <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
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
                  sub={`${stats.in_progress} in progress`}
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

              {/* Department Breakdown */}
              <div className="card" style={{ padding: 28, borderRadius: 18, boxShadow: '0 6px 24px rgba(0,0,0,0.04)' }}>
                <div className="flex row-between mb-6" style={{ alignItems: 'center' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                    <Building2 size={22} color="var(--brand-500)" /> Department Completion Breakdown
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
                    <table className="data" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '14px 18px' }}>Department</th>
                          <th style={{ padding: '14px 18px' }}>Total Assigned</th>
                          <th style={{ padding: '14px 18px' }}>Completed</th>
                          <th style={{ padding: '14px 18px' }}>Overdue</th>
                          <th style={{ padding: '14px 18px' }}>Completion Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptStats.map((d) => (
                          <tr key={d.department}>
                            <td style={{ padding: '16px 18px' }}><strong>{d.department}</strong></td>
                            <td style={{ padding: '16px 18px' }}>{d.total}</td>
                            <td style={{ padding: '16px 18px' }}>{d.completed}</td>
                            <td style={{ padding: '16px 18px' }}>
                              {d.overdue > 0 ? (
                                <Badge variant="badge-red">{d.overdue} Overdue</Badge>
                              ) : (
                                <span style={{ color: 'var(--text-3)' }}>0</span>
                              )}
                            </td>
                            <td style={{ padding: '16px 18px', minWidth: 220 }}>
                              <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
                                <div style={{ flex: 1, height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${d.completion_pct}%`,
                                      borderRadius: 999,
                                      background:
                                        d.completion_pct >= 80
                                          ? 'linear-gradient(90deg, #10b981, #059669)'
                                          : d.completion_pct >= 50
                                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                      transition: 'width 0.4s ease',
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{d.completion_pct}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Course Completion Breakdown */}
              <div className="card" style={{ padding: 28, borderRadius: 18, boxShadow: '0 6px 24px rgba(0,0,0,0.04)' }}>
                <div className="flex row-between mb-6" style={{ alignItems: 'center' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                    <BookOpen size={22} color="var(--brand-500)" /> Course Completion Breakdown
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
                    <table className="data" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '14px 18px' }}>Course Title</th>
                          <th style={{ padding: '14px 18px' }}>Total Assigned</th>
                          <th style={{ padding: '14px 18px' }}>Completed</th>
                          <th style={{ padding: '14px 18px' }}>Overdue</th>
                          <th style={{ padding: '14px 18px' }}>Completion Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseStats.map((c) => (
                          <tr key={c.course_title}>
                            <td style={{ padding: '16px 18px' }}><strong>{c.course_title}</strong></td>
                            <td style={{ padding: '16px 18px' }}>{c.total}</td>
                            <td style={{ padding: '16px 18px' }}>{c.completed}</td>
                            <td style={{ padding: '16px 18px' }}>
                              {c.overdue > 0 ? (
                                <Badge variant="badge-red">{c.overdue} Overdue</Badge>
                              ) : (
                                <span style={{ color: 'var(--text-3)' }}>0</span>
                              )}
                            </td>
                            <td style={{ padding: '16px 18px', minWidth: 220 }}>
                              <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
                                <div style={{ flex: 1, height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${c.completion_pct}%`,
                                      borderRadius: 999,
                                      background:
                                        c.completion_pct >= 80
                                          ? 'linear-gradient(90deg, #10b981, #059669)'
                                          : c.completion_pct >= 50
                                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                      transition: 'width 0.4s ease',
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{c.completion_pct}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Overdue Assignments Section */}
              <div className="card" style={{ padding: 28, borderRadius: 18, boxShadow: '0 6px 24px rgba(0,0,0,0.04)' }}>
                <div className="flex row-between mb-6" style={{ alignItems: 'center' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--red-600)' }}>
                    <AlertTriangle size={22} /> Overdue Assignments ({overdueList.length})
                  </h3>
                </div>

                {overdueList.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 20px',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                      borderRadius: 14,
                      border: '1px solid #a7f3d0',
                      color: '#047857',
                      fontWeight: 700,
                      fontSize: 14.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                  >
                    <CheckCircle2 size={22} color="#059669" />
                    <span>Awesome! All employees are up to date with their training assignments. No overdue items.</span>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="data" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '14px 18px' }}>Employee</th>
                          <th style={{ padding: '14px 18px' }}>Department</th>
                          <th style={{ padding: '14px 18px' }}>Course Title</th>
                          <th style={{ padding: '14px 18px' }}>Cycle</th>
                          <th style={{ padding: '14px 18px' }}>Due Date</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueList.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: '16px 18px' }}>
                              <strong style={{ color: 'var(--text)' }}>{item.employee_name}</strong>
                              <div className="muted" style={{ fontSize: 12 }}>{item.employee_email}</div>
                            </td>
                            <td style={{ padding: '16px 18px' }}>{item.department || '—'}</td>
                            <td style={{ padding: '16px 18px' }}><strong>{item.course_title}</strong></td>
                            <td style={{ padding: '16px 18px' }}><span className="chip">{item.cycle}</span></td>
                            <td style={{ padding: '16px 18px', color: 'var(--red-600)', fontWeight: 700 }}>
                              {item.due_date ? item.due_date.slice(0, 10) : '—'}
                            </td>
                            <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                              <button
                                className="btn-ghost btn-sm flex"
                                style={{ gap: 4, marginLeft: 'auto' }}
                                title="Inspect Progress"
                                onClick={() => { setSelectedProgress(item); setEyeModal(true); }}
                              >
                                <Eye size={15} color="var(--brand-600)" /> <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: TRAINING CATALOGUE */}
      {activeTab === 'courses' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card flex wrap" style={{ gap: 14, padding: '20px 24px', borderRadius: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-3)' }} />
              <input
                className="input"
                style={{ paddingLeft: 40, width: '100%' }}
                placeholder="Search courses by title..."
                value={courseQ}
                onChange={(e) => setCourseQ(e.target.value)}
              />
            </div>
            <select
              className="select"
              style={{ width: 180 }}
              value={courseCat}
              onChange={(e) => setCourseCat(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Security">Security</option>
              <option value="Compliance">Compliance</option>
              <option value="Technical">Technical</option>
              <option value="Soft Skills">Soft Skills</option>
              <option value="Internal">Internal</option>
            </select>
          </div>

          {coursesLoading ? (
            <LoadingSpinner />
          ) : coursesData.length === 0 ? (
            <EmptyState icon={BookOpen} title="No training courses found" message="Create your first training course to start assignment workflows." />
          ) : (
            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {coursesData.map((c) => (
                <div key={c.id} className="card" style={{ padding: 26, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                  <div className="flex row-between">
                    <Badge variant="badge-blue" style={{ fontSize: 12, padding: '4px 12px' }}>{c.category}</Badge>
                    <Badge variant={c.is_active ? 'badge-green' : 'badge-gray'} style={{ fontSize: 12 }}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>{c.title}</h3>
                    <div className="muted mt-2" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                      {c.description || 'No description provided.'}
                    </div>
                  </div>

                  <div className="stack" style={{ gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                    <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                      <Clock size={15} color="var(--brand-600)" /> <span>Duration: <strong>{formatDurationText(c.duration_minutes)}</strong></span>
                    </div>
                    <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                      <HelpCircle size={15} color="var(--brand-600)" /> <span>Pass Threshold: <strong>{c.pass_mark}%</strong> ({c.question_count} questions)</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {c.video_url ? (
                      <button
                        className="btn-primary btn-block flex"
                        style={{ gap: 8, justifyContent: 'center', padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}
                        onClick={() => openVideoPlayer(c)}
                      >
                        <Video size={16} /> <span>Watch Video on Platform</span>
                      </button>
                    ) : (
                      <div className="muted text-center" style={{ fontSize: 12, padding: '8px', background: 'var(--surface-2)', borderRadius: 8 }}>
                        No video URL attached
                      </div>
                    )}

                    <div className="flex" style={{ gap: 8 }}>
                      <button className="btn-soft btn-sm flex" style={{ flex: 1, gap: 4, justifyContent: 'center' }} onClick={() => openQBank(c)}>
                        <HelpCircle size={14} /> <span>Questions ({c.question_count})</span>
                      </button>
                      <button
                        className="btn-soft btn-sm flex"
                        style={{ gap: 4, color: 'var(--brand-600)' }}
                        title="Assign Course"
                        onClick={() => openAssignModal(c.id)}
                      >
                        <UserPlus size={14} /> <span>Assign</span>
                      </button>
                      <button className="btn-soft btn-sm" onClick={() => openEditCourse(c)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => deleteCourse(c.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSIGNMENT RULES */}
      {activeTab === 'rules' && (
        <div className="fade-in">
          {rulesLoading ? (
            <LoadingSpinner />
          ) : rulesData.length === 0 ? (
            <EmptyState icon={Sliders} title="No assignment rules defined" message="Add rules to automate quarterly training assignments for active employees." />
          ) : (
            <div className="card" style={{ padding: 0, borderRadius: 18, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table className="data" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '16px 20px' }}>Rule Name</th>
                      <th style={{ padding: '16px 18px' }}>Target Course</th>
                      <th style={{ padding: '16px 18px' }}>Criteria (Dept / Desig / Loc)</th>
                      <th style={{ padding: '16px 18px' }}>Cycle & Due Days</th>
                      <th style={{ padding: '16px 18px' }}>Status</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rulesData.map((r) => (
                      <tr key={r.id}>
                        <td style={{ padding: '16px 20px' }}><strong>{r.name}</strong></td>
                        <td style={{ padding: '16px 18px' }}>
                          <Badge variant="badge-blue">{r.course_title || 'Course #' + r.course_id}</Badge>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontSize: 12.5 }}>
                            <div>Dept: <strong>{r.match_department || 'All'}</strong></div>
                            <div>Desig: <strong>{r.match_designation || 'All'}</strong></div>
                            <div>Loc: <strong>{r.match_location || 'All'}</strong></div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <div>{r.recurrence}</div>
                          <div className="muted" style={{ fontSize: 12 }}>Due in {r.due_days} days</div>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <Badge variant={r.is_active ? 'badge-green' : 'badge-gray'}>
                            {r.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn-soft btn-sm" onClick={() => openEditRule(r)}>Edit</button>
                            <button className="btn-danger btn-sm" onClick={() => deleteRule(r.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* In-App Embedded Video Player Modal */}
      <Modal
        open={videoModal}
        onClose={() => setVideoModal(false)}
        title={`Course Video: ${playingCourse?.title || ''}`}
        width={780}
      >
        {playingCourse && (
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              {playingCourse.video_url?.includes('youtube') || playingCourse.video_url?.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(playingCourse.video_url)}
                  title={playingCourse.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={playingCourse.video_url}
                  controls
                  autoPlay
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{playingCourse.title}</div>
              <div className="muted mt-1" style={{ fontSize: 13 }}>{playingCourse.description || 'Watch the training module to complete video requirement.'}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Course Assignment Modal */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title="Assign Course to Employee"
        width={500}
        footer={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setAssignModal(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={submitManualAssign} disabled={busy}>
              {busy ? 'Assigning...' : 'Assign Course'}
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 16 }}>
          <div className="field">
            <label>Select Employee *</label>
            <select
              className="select"
              value={assignForm.employee_id}
              onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
            >
              {employeeList.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_code} • {e.department || 'General'})</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Select Course *</label>
            <select
              className="select"
              value={assignForm.course_id}
              onChange={(e) => setAssignForm({ ...assignForm, course_id: e.target.value })}
            >
              {coursesData.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Due Period (Days)</label>
            <input
              type="number"
              className="input"
              value={assignForm.due_days}
              onChange={(e) => setAssignForm({ ...assignForm, due_days: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Employee Eye Progress Modal */}
      <Modal
        open={eyeModal}
        onClose={() => setEyeModal(false)}
        title="Employee Assignment Progress"
        width={480}
      >
        {selectedProgress && (
          <div className="stack" style={{ gap: 18 }}>
            <div className="flex" style={{ gap: 12, alignItems: 'center', padding: 14, background: 'var(--surface-2)', borderRadius: 12 }}>
              <Avatar name={selectedProgress.employee_name} size={46} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedProgress.employee_name}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{selectedProgress.employee_email}</div>
              </div>
            </div>

            <div className="stack" style={{ gap: 10, fontSize: 13 }}>
              <div className="flex row-between">
                <span className="muted">Assigned Course:</span>
                <strong>{selectedProgress.course_title}</strong>
              </div>
              <div className="flex row-between">
                <span className="muted">Cycle:</span>
                <span className="chip">{selectedProgress.cycle}</span>
              </div>
              <div className="flex row-between">
                <span className="muted">Due Date:</span>
                <strong style={{ color: 'var(--red-600)' }}>{selectedProgress.due_date?.slice(0, 10)}</strong>
              </div>
              <div className="flex row-between">
                <span className="muted">Status:</span>
                <Badge variant="badge-red" dot>Overdue</Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Course Modal */}
      <Modal
        open={courseModal}
        onClose={() => setCourseModal(false)}
        title={editCourseId ? 'Edit Training Course' : 'Create Training Course'}
        footer={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setCourseModal(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={saveCourse} disabled={busy}>
              {busy ? 'Saving…' : editCourseId ? 'Update Course' : 'Create Course'}
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label>Course Title *</label>
            <input className="input" placeholder="e.g. Information Security 101" value={courseForm.title} onChange={setC('title')} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Category</label>
              <select className="select" value={courseForm.category} onChange={setC('category')}>
                <option value="Security">Security</option>
                <option value="Compliance">Compliance</option>
                <option value="Technical">Technical</option>
                <option value="Soft Skills">Soft Skills</option>
                <option value="Internal">Internal</option>
              </select>
            </div>
            <div className="field">
              <label>Duration (Minutes)</label>
              <input type="number" className="input" value={courseForm.duration_minutes} onChange={setC('duration_minutes')} />
            </div>
          </div>
          <div className="field">
            <label>Video URL (MP4 / YouTube)</label>
            <input className="input" placeholder="https://www.youtube.com/watch?v=..." value={courseForm.video_url} onChange={setC('video_url')} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={3} value={courseForm.description} onChange={setC('description')} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Pass Mark (%)</label>
              <input type="number" className="input" value={courseForm.pass_mark} onChange={setC('pass_mark')} />
            </div>
            <div className="field">
              <label>Recurrence</label>
              <select className="select" value={courseForm.recurrence} onChange={setC('recurrence')}>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Rule Modal */}
      <Modal
        open={ruleModal}
        onClose={() => setRuleModal(false)}
        title={editRuleId ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
        footer={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setRuleModal(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={saveRule} disabled={busy}>
              {busy ? 'Saving…' : editRuleId ? 'Update Rule' : 'Create Rule'}
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label>Rule Name *</label>
            <input className="input" placeholder="e.g. Mandatory Engineering Security Rule" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
          </div>

          <div className="field">
            <label>Target Course *</label>
            <select className="select" value={ruleForm.course_id} onChange={(e) => setRuleForm({ ...ruleForm, course_id: e.target.value })}>
              {coursesData.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
              ))}
            </select>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Match Department</label>
              <input className="input" placeholder="All" value={ruleForm.match_department} onChange={(e) => setRuleForm({ ...ruleForm, match_department: e.target.value })} />
            </div>
            <div className="field">
              <label>Match Designation</label>
              <input className="input" placeholder="All" value={ruleForm.match_designation} onChange={(e) => setRuleForm({ ...ruleForm, match_designation: e.target.value })} />
            </div>
            <div className="field">
              <label>Match Location</label>
              <input className="input" placeholder="All" value={ruleForm.match_location} onChange={(e) => setRuleForm({ ...ruleForm, match_location: e.target.value })} />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Due Days</label>
              <input type="number" className="input" value={ruleForm.due_days} onChange={(e) => setRuleForm({ ...ruleForm, due_days: e.target.value })} />
            </div>
            <div className="field">
              <label>Recurrence</label>
              <select className="select" value={ruleForm.recurrence} onChange={(e) => setRuleForm({ ...ruleForm, recurrence: e.target.value })}>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
                <option value="One-time">One-time</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Question Bank Modal */}
      <Modal
        open={qBankModal}
        onClose={() => setQBankModal(false)}
        title={`Exam Questions: ${selectedCourse?.title || ''}`}
        width={620}
        footer={<button className="btn-ghost btn-sm" onClick={() => setQBankModal(false)}>Close</button>}
      >
        <div>
          <div className="row-between mb-4">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Total Questions: {questions.length}</span>
            <button className="btn-primary btn-sm flex" style={{ gap: 4 }} onClick={openAddQ}>
              <Plus size={14} /> <span>Add Question</span>
            </button>
          </div>

          {qFormOpen && (
            <div className="card mb-4" style={{ padding: 16, background: 'var(--surface-2)' }}>
              <div className="field">
                <label>Question Text *</label>
                <input className="input" value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} />
              </div>
              <div className="stack mb-3" style={{ gap: 8 }}>
                {qForm.options.map((opt, idx) => (
                  <div key={idx} className="flex" style={{ gap: 8 }}>
                    <input
                      type="radio"
                      name="correct_opt"
                      checked={qForm.correct_option === idx}
                      onChange={() => setQForm({ ...qForm, correct_option: idx })}
                    />
                    <input
                      className="input"
                      style={{ padding: 6, fontSize: 13 }}
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...qForm.options]
                        newOpts[idx] = e.target.value
                        setQForm({ ...qForm, options: newOpts })
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex" style={{ justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn-ghost btn-sm" onClick={() => setQFormOpen(false)}>Cancel</button>
                <button className="btn-primary btn-sm" onClick={saveQuestion} disabled={busy}>Save Question</button>
              </div>
            </div>
          )}

          {qLoading ? (
            <LoadingSpinner />
          ) : questions.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No exam questions" message="Add multiple choice questions for course evaluation." />
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {questions.map((qItem, idx) => (
                <div key={qItem.id} className="card" style={{ padding: 14 }}>
                  <div className="row-between">
                    <strong style={{ fontSize: 13.5 }}>{idx + 1}. {qItem.question}</strong>
                    <div className="flex" style={{ gap: 4 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEditQ(qItem)}><Edit3 size={13} /></button>
                      <button className="btn-danger btn-sm" onClick={() => deleteQuestion(qItem.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="grid mt-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                    {(qItem.options || []).map((o, oIdx) => (
                      <div key={oIdx} style={{ color: oIdx === qItem.correct_option ? 'var(--green-700)' : 'var(--text-2)', fontWeight: oIdx === qItem.correct_option ? 700 : 400 }}>
                        {oIdx === qItem.correct_option ? '✓ ' : '• '}{o}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Engine Run Results Modal */}
      <Modal
        open={runResultModal}
        onClose={() => setRunResultModal(false)}
        title="Assignment Engine Execution Result"
        width={480}
        footer={<button className="btn-primary btn-sm" onClick={() => setRunResultModal(false)}>Awesome</button>}
      >
        {runResult && (
          <div className="stack" style={{ gap: 16 }}>
            <div className="flex" style={{ gap: 12, padding: 14, background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0' }}>
              <Zap size={22} color="#059669" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#047857' }}>Cycle {runResult.cycle} Completed</div>
                <div style={{ fontSize: 12.5, color: '#065f46', marginTop: 2 }}>{runResult.assignments_created} new assignments generated.</div>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <span className="muted">Rules Evaluated:</span> <strong>{runResult.rules_evaluated}</strong>
              </div>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <span className="muted">Employees Evaluated:</span> <strong>{runResult.total_employees}</strong>
              </div>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <span className="muted">Matches Found:</span> <strong>{runResult.matches_found}</strong>
              </div>
              <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <span className="muted">Assignments Created:</span> <strong style={{ color: 'var(--brand-600)' }}>{runResult.assignments_created}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

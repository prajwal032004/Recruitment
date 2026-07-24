import { useState } from 'react'
import { BookOpen, Plus, Search, Edit3, Trash2, HelpCircle, CheckCircle2, Video } from 'lucide-react'
import { apiGet, apiPost, apiPut } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

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

export default function TrainingCourses() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const { data: courses, loading, error, refetch } = useFetch(`/training/courses?search=${encodeURIComponent(q)}&category=${encodeURIComponent(catFilter)}`, [q, catFilter])

  // Course Modal
  const [courseModal, setCourseModal] = useState(false)
  const [courseForm, setCourseForm] = useState(BLANK_COURSE)
  const [editCourseId, setEditCourseId] = useState(null)
  
  // Question Bank Modal
  const [qBankModal, setQBankModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qLoading, setQLoading] = useState(false)
  
  // Question Add/Edit
  const [qForm, setQForm] = useState(BLANK_QUESTION)
  const [editQId, setEditQId] = useState(null)
  const [qFormOpen, setQFormOpen] = useState(false)

  const [busy, setBusy] = useState(false)

  const setC = (k) => (e) => setCourseForm({ ...courseForm, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  // Video Preview Modal State
  const [videoModal, setVideoModal] = useState(false)
  const [previewCourse, setPreviewCourse] = useState(null)

  const openPreviewVideo = (c) => {
    setPreviewCourse(c)
    setVideoModal(true)
  }

  const deleteCourse = async (cid) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this training course?')) return
    try {
      await api.delete(`/training/courses/${cid}`)
      toast.success('Course deactivated successfully')
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to delete course')
    }
  }

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
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to save course')
    } finally {
      setBusy(false)
    }
  }

  const openQBank = async (course) => {
    setSelectedCourse(course)
    setQBankModal(true)
    setQFormOpen(false)
    setQLoading(true)
    try {
      const res = await apiGet(`/training/courses/${course.id}/questions`)
      setQuestions(res || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load question bank')
    } finally {
      setQLoading(false)
    }
  }

  const openAddQuestion = () => {
    setEditQId(null)
    setQForm(BLANK_QUESTION)
    setQFormOpen(true)
  }

  const openEditQuestion = (qObj) => {
    setEditQId(qObj.id)
    setQForm({
      question: qObj.question || '',
      options: Array.isArray(qObj.options) && qObj.options.length ? [...qObj.options] : ['', '', '', ''],
      correct_option: qObj.correct_option ?? 0,
      marks: qObj.marks || 1
    })
    setQFormOpen(true)
  }

  const saveQuestion = async () => {
    if (!qForm.question || qForm.options.some(o => !o.trim())) {
      return toast.error('Please enter the question and all option choices.')
    }
    setBusy(true)
    try {
      if (editQId) {
        await apiPut(`/training/courses/${selectedCourse.id}/questions/${editQId}`, qForm)
        toast.success('Question updated')
      } else {
        await apiPost(`/training/courses/${selectedCourse.id}/questions`, qForm)
        toast.success('Question added')
      }
      setQFormOpen(false)
      // refresh questions list
      const updated = await apiGet(`/training/courses/${selectedCourse.id}/questions`)
      setQuestions(updated || [])
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to save question')
    } finally {
      setBusy(false)
    }
  }

  const deleteQuestion = async (qid) => {
    if (!window.confirm('Delete this question from bank?')) return
    try {
      await api.delete(`/training/courses/${selectedCourse.id}/questions/${qid}`)
      toast.success('Question deleted')
      setQuestions(prev => prev.filter(q => q.id !== qid))
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to delete question')
    }
  }

  return (
    <div>
      <PageHeader
        title="Training Catalogue"
        subtitle="Manage mandatory compliance, security, and technology courses with video content and exam question banks."
        icon={BookOpen}
        actions={
          <button className="btn-primary btn-sm flex" style={{ gap: 4 }} onClick={openAddCourse}>
            <Plus size={14} /> <span>Create Course</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="card flex wrap mb-4" style={{ gap: 12, padding: '16px 20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-3)' }} />
          <input
            className="input"
            style={{ paddingLeft: 40, width: '100%' }}
            placeholder="Search courses..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="select" style={{ width: 170 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Security">Security</option>
          <option value="Compliance">Compliance</option>
          <option value="Internal">Internal</option>
          <option value="Technology">Technology</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (courses || []).length === 0 ? (
        <EmptyState icon={BookOpen} title="No training courses created yet" message="Create security, compliance, or technology courses for your workforce." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Category</th>
                <th>Recurrence</th>
                <th>Duration & Pass Mark</th>
                <th>Questions</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ fontSize: 14 }}>{c.title}</strong>
                    {c.video_url && (
                      <div className="muted flex" style={{ gap: 4, fontSize: 12, alignItems: 'center', marginTop: 2 }}>
                        <Video size={12} /> {c.video_url}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge variant={
                      c.category === 'Security' ? 'badge-red' :
                      c.category === 'Compliance' ? 'badge-amber' :
                      c.category === 'Technology' ? 'badge-blue' : 'badge-green'
                    }>
                      {c.category}
                    </Badge>
                  </td>
                  <td>{c.recurrence}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.duration_minutes} mins</div>
                    <div className="muted" style={{ fontSize: 11 }}>Pass mark: {c.pass_mark}%</div>
                  </td>
                  <td>
                    <span className="chip" style={{ fontWeight: 700 }}>{c.question_count} questions</span>
                  </td>
                  <td>
                    <Badge variant={c.is_active ? 'badge-green' : 'badge-red'}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn-soft btn-sm flex"
                        style={{ gap: 4 }}
                        title="Preview Video in Pop-up Modal"
                        onClick={() => openPreviewVideo(c)}
                      >
                        <Video size={14} color="var(--brand-600)" /> <span>Preview</span>
                      </button>
                      <button className="btn-soft btn-sm flex" style={{ gap: 4 }} onClick={() => openQBank(c)}>
                        <HelpCircle size={14} /> <span>Questions ({c.question_count})</span>
                      </button>
                      <button className="btn-ghost btn-sm" title="Edit Course" onClick={() => openEditCourse(c)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-ghost btn-sm" title="Delete Course" style={{ color: 'var(--red-600)' }} onClick={() => deleteCourse(c.id)}>
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

      {/* Add / Edit Course Modal */}
      <Modal
        open={courseModal}
        onClose={() => setCourseModal(false)}
        title={editCourseId ? "Edit Course" : "Create Training Course"}
        width={580}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCourseModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveCourse} disabled={busy}>
              {busy ? 'Saving…' : editCourseId ? 'Update Course' : 'Create Course'}
            </button>
          </>
        }
      >
        <div className="field">
          <label>Course Title *</label>
          <input className="input" value={courseForm.title} onChange={setC('title')} placeholder="e.g. Cybersecurity Fundamentals 2026" />
        </div>

        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Category</label>
            <select className="select" value={courseForm.category} onChange={setC('category')}>
              <option value="Security">Security</option>
              <option value="Compliance">Compliance</option>
              <option value="Internal">Internal</option>
              <option value="Technology">Technology</option>
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Recurrence</label>
            <select className="select" value={courseForm.recurrence} onChange={setC('recurrence')}>
              <option value="Quarterly">Quarterly</option>
              <option value="One-time">One-time</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
        </div>

        <div className="flex" style={{ gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Duration (minutes)</label>
            <input className="input" type="number" value={courseForm.duration_minutes} onChange={setC('duration_minutes')} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Exam Pass Mark (%)</label>
            <input className="input" type="number" min="1" max="100" value={courseForm.pass_mark} onChange={setC('pass_mark')} />
          </div>
        </div>

        <div className="field">
          <label>Video Stream URL (MP4 / HLS / Embed)</label>
          <input className="input" value={courseForm.video_url} onChange={setC('video_url')} placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={courseForm.description} onChange={setC('description')} placeholder="Overview of learning objectives and compliance mandate..." />
        </div>

        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="is_active_check" checked={courseForm.is_active} onChange={setC('is_active')} />
          <label htmlFor="is_active_check" style={{ margin: 0, cursor: 'pointer' }}>Active (available for rule assignment)</label>
        </div>
      </Modal>

      {/* Question Bank Modal */}
      <Modal
        open={qBankModal}
        onClose={() => setQBankModal(false)}
        title={selectedCourse ? `Question Bank — ${selectedCourse.title}` : "Question Bank"}
        width={720}
        footer={
          <button className="btn-ghost" onClick={() => setQBankModal(false)}>Close</button>
        }
      >
        <div className="flex row-between mb-4" style={{ alignItems: 'center' }}>
          <div>
            <span className="muted" style={{ fontSize: 13 }}>Total questions: </span>
            <strong>{questions.length}</strong>
          </div>
          {!qFormOpen && (
            <button className="btn-primary btn-sm flex" style={{ gap: 4 }} onClick={openAddQuestion}>
              <Plus size={14} /> <span>Add Question</span>
            </button>
          )}
        </div>

        {qFormOpen && (
          <div className="card mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <h4 className="mb-3" style={{ fontSize: 14, fontWeight: 700 }}>
              {editQId ? "Edit Question" : "New Exam Question"}
            </h4>
            <div className="field">
              <label>Question Text *</label>
              <input className="input" value={qForm.question} onChange={(e) => setQForm({ ...qForm, question: e.target.value })} placeholder="Enter question..." />
            </div>

            <div className="field">
              <label>Answer Choices (4 choices required)</label>
              {qForm.options.map((opt, idx) => (
                <div key={idx} className="flex mb-2" style={{ gap: 8, alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="correct_choice"
                    checked={qForm.correct_option === idx}
                    onChange={() => setQForm({ ...qForm, correct_option: idx })}
                    title="Mark as correct option"
                  />
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...qForm.options]
                      copy[idx] = e.target.value
                      setQForm({ ...qForm, options: copy })
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                  {qForm.correct_option === idx && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-600)' }}>Correct</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex" style={{ gap: 10, alignItems: 'center', marginTop: 12 }}>
              <div className="field" style={{ width: 120 }}>
                <label>Marks</label>
                <input className="input" type="number" min="1" value={qForm.marks} onChange={(e) => setQForm({ ...qForm, marks: parseInt(e.target.value) || 1 })} />
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn-ghost btn-sm" onClick={() => setQFormOpen(false)}>Cancel</button>
                <button className="btn-primary btn-sm" onClick={saveQuestion} disabled={busy}>
                  {busy ? 'Saving…' : editQId ? 'Save Question' : 'Add Question'}
                </button>
              </div>
            </div>
          </div>
        )}

        {qLoading ? (
          <LoadingSpinner />
        ) : questions.length === 0 ? (
          <div className="muted" style={{ padding: 24, textAlign: 'center', background: 'var(--surface-2)', borderRadius: 8 }}>
            No questions in this course question bank yet. Click "Add Question" to create one.
          </div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {questions.map((qObj, idx) => (
              <div key={qObj.id} className="card mb-3" style={{ padding: '14px 16px', background: 'var(--surface-1)' }}>
                <div className="flex row-between" style={{ alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: 13.5 }}>Q{idx + 1}. {qObj.question}</strong>
                  <div className="flex" style={{ gap: 6 }}>
                    <button className="btn-ghost btn-sm" onClick={() => openEditQuestion(qObj)}><Edit3 size={13} /></button>
                    <button className="btn-ghost btn-sm" style={{ color: 'var(--red-500)' }} onClick={() => deleteQuestion(qObj.id)}><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="mt-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {qObj.options.map((opt, i) => (
                    <div key={i} style={{
                      fontSize: 12, padding: '4px 8px', borderRadius: 4,
                      background: i === qObj.correct_option ? '#ecfdf5' : '#f8fafc',
                      color: i === qObj.correct_option ? '#047857' : 'var(--text-2)',
                      fontWeight: i === qObj.correct_option ? 700 : 400,
                      border: i === qObj.correct_option ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                    }}>
                      {i === qObj.correct_option ? '✓ ' : ''}{opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Admin Course Video Preview Modal */}
      <Modal
        open={videoModal}
        onClose={() => setVideoModal(false)}
        title={`Preview Course Video: ${previewCourse?.title || ''}`}
        width={780}
      >
        {previewCourse && (
          <div className="stack" style={{ gap: 16 }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000', borderRadius: 14, overflow: 'hidden' }}>
              {previewCourse.video_url?.includes('youtube') || previewCourse.video_url?.includes('youtu.be') ? (
                <iframe
                  src={
                    previewCourse.video_url.includes('embed/')
                      ? previewCourse.video_url
                      : `https://www.youtube.com/embed/${
                          previewCourse.video_url.includes('v=')
                            ? previewCourse.video_url.split('v=')[1]?.split('&')[0]
                            : previewCourse.video_url.split('youtu.be/')[1]?.split('?')[0]
                        }`
                  }
                  title={previewCourse.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewCourse.video_url}
                  controls
                  autoPlay
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{previewCourse.title}</div>
              <div className="muted mt-1" style={{ fontSize: 13 }}>{previewCourse.description || 'Watch the training module to test video stream.'}</div>
              <div className="flex wrap mt-3" style={{ gap: 12, fontSize: 12.5, color: 'var(--text-2)' }}>
                <span>Category: <strong>{previewCourse.category}</strong></span>
                <span>•</span>
                <span>Duration: <strong>{previewCourse.duration_minutes} mins</strong></span>
                <span>•</span>
                <span>Pass Mark: <strong>{previewCourse.pass_mark}%</strong></span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

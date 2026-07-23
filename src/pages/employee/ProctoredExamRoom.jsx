import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ShieldAlert, Clock, CheckCircle2, AlertTriangle, HelpCircle, Lock, ArrowLeft, ArrowRight, Check, Award, Sparkles, LogOut, Eye, Play, Pause
} from 'lucide-react'
import api, { apiGet, apiPost } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, ErrorState, Badge, Avatar, Modal } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

const MAX_PAUSES = 10

const DEMO_QUESTIONS = [
  {
    id: 101,
    question: 'What is the primary objective of corporate data security compliance?',
    options: [
      'To restrict employee access to computer monitors',
      'To protect sensitive company and client data from unauthorized access or breaches',
      'To delete old emails every Friday afternoon',
      'To increase office printing budgets'
    ],
    correct_option: 1
  },
  {
    id: 102,
    question: 'Under the proctored anti-cheating policy, how many pause/switch chances are allowed before mandatory auto-submission?',
    options: [
      '1 chance only',
      '5 chances',
      '10 chances (on the 10th violation, the exam auto-submits)',
      'Unlimited chances'
    ],
    correct_option: 2
  },
  {
    id: 103,
    question: 'How far ahead can an employee fast-forward during training video playback?',
    options: [
      'Unlimited fast-forwarding to the end',
      'Maximum of 1 minute (60 seconds) ahead of highest watched time',
      'Maximum of 10 minutes ahead',
      'Fast-forwarding is completely disabled'
    ],
    correct_option: 1
  }
]

export default function ProctoredExamRoom() {
  const { aid } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const isDemo = aid === 'demo' || aid === '0'

  const [loading, setLoading] = useState(!isDemo)
  const [error, setError] = useState(null)
  const [examPaper, setExamPaper] = useState(
    isDemo
      ? { assignment_id: 0, course_title: 'Proctored Demo Practice Exam', pass_mark: 70, questions: DEMO_QUESTIONS }
      : null
  )

  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [violationsCount, setViolationsCount] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [examResult, setExamResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes timer
  const [isFullscreen, setIsFullscreen] = useState(false)

  const examResultRef = useRef(null)
  const submittingRef = useRef(false)
  const isPausedRef = useRef(false)

  examResultRef.current = examResult
  submittingRef.current = submitting
  isPausedRef.current = isPaused

  // 1. Fetch Exam Paper from API if not demo
  useEffect(() => {
    if (isDemo) return
    let active = true
    async function loadPaper() {
      setLoading(true)
      setError(null)
      try {
        const res = await apiGet(`/training/assignments/${aid}/exam`)
        if (active) {
          setExamPaper(res)
          const qCount = res.questions?.length || 5
          setTimeLeft(Math.max(5, qCount * 3) * 60) // 3 mins per question
        }
      } catch (e) {
        if (active) setError(e.message || 'Failed to load exam paper.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadPaper()
    return () => { active = false }
  }, [aid, isDemo])

  // 2. Request Full-Screen Mode on Load
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    }
  }, [])

  // 3. 10-CHANCES PAUSE SECURITY MONITOR (Tab Switching, Fullscreen Exit, Window Blur)
  const triggerExamPause = (reason) => {
    if (examResultRef.current || submittingRef.current || isPausedRef.current) return

    setViolationsCount((prev) => {
      const next = prev + 1
      if (next >= MAX_PAUSES) {
        toast.error(`Security Limit Reached (Strike ${MAX_PAUSES}/${MAX_PAUSES})! Exam auto-submitted due to ${reason}.`)
        submitExam()
      } else {
        setPauseReason(reason)
        setIsPaused(true)
        isPausedRef.current = true
        toast.error(`Exam Paused (Strike ${next}/${MAX_PAUSES}): ${reason} detected! Re-engage fullscreen to resume.`)
      }
      return next
    })
  }

  // Resume Exam & Re-engage Fullscreen
  const resumeExam = () => {
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    }
    setIsPaused(false)
    isPausedRef.current = false
    toast.success('Full-screen re-engaged. Exam resumed.')
  }

  // 4. Fullscreen & Focus Listeners
  useEffect(() => {
    if (examResult || loading || error) return

    const handleFSChange = () => {
      const activeFS = !!document.fullscreenElement
      setIsFullscreen(activeFS)
      if (!activeFS && !examResultRef.current && !submittingRef.current && !isPausedRef.current) {
        triggerExamPause('Full-Screen Mode Exited')
      }
    }

    const handleContextMenu = (e) => {
      e.preventDefault()
      toast.warning('Right-clicking is disabled in the Secured Exam Room.')
    }

    const handleCopyPaste = (e) => {
      e.preventDefault()
      toast.warning('Copying or pasting text is disabled during the exam.')
    }

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && ['c', 'v', 'u', 'i', 'j', 's', 'a'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault()
        toast.warning('Keyboard shortcuts and developer tools are disabled.')
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && !isPausedRef.current) {
        triggerExamPause('Tab Switch / Window Minimization')
      }
    }

    const handleBlur = () => {
      if (!isPausedRef.current) {
        triggerExamPause('Leaving Exam Window / Focus Loss')
      }
    }

    document.addEventListener('fullscreenchange', handleFSChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('cut', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)
    document.addEventListener('selectstart', handleCopyPaste)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('cut', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
      document.removeEventListener('selectstart', handleCopyPaste)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [examResult, loading, error])

  // 5. Live Countdown Timer (Pauses when isPaused is true)
  useEffect(() => {
    if (examResult || loading || error || isPaused) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          toast.error('Time expired! Submitting your exam automatically...')
          submitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [examResult, loading, error, isPaused])

  const exitFS = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }

  const submitExam = async () => {
    if (submittingRef.current || examResultRef.current) return
    setSubmitting(true)
    submittingRef.current = true
    setIsPaused(false)
    exitFS()

    if (isDemo) {
      let earned = 0
      DEMO_QUESTIONS.forEach((q) => {
        if (userAnswers[q.id] === q.correct_option) earned += 1
      })
      const scorePct = Math.round((earned / DEMO_QUESTIONS.length) * 100)
      const passed = scorePct >= 70
      const res = {
        attempt_no: 1,
        score: scorePct,
        passed,
        pass_mark: 70,
      }
      setExamResult(res)
      examResultRef.current = res
      setSubmitting(false)
      submittingRef.current = false
      if (passed) toast.success(`Demo Exam Passed! Score: ${scorePct}%`)
      else toast.error(`Demo Exam Score: ${scorePct}%. Pass mark is 70%.`)
      return
    }

    try {
      const res = await apiPost(`/training/assignments/${aid}/exam`, {
        answers: userAnswers,
      })
      setExamResult(res)
      examResultRef.current = res
      if (res.passed) {
        toast.success(`Congratulations! You passed with ${res.score}%`)
      } else {
        toast.error(`Score: ${res.score}%. Pass mark is ${res.pass_mark}%.`)
      }
    } catch (e) {
      toast.error(e.message || 'Exam submission failed.')
    } finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  const exitRoom = () => {
    exitFS()
    navigate('/app/my-trainings')
  }

  if (loading) return <LoadingSpinner full label="Entering Secured Exam Room..." />

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', padding: 24 }}>
        <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: 36, borderRadius: 20 }}>
          <ErrorState message={error} />
          <button className="btn-primary mt-6" onClick={exitRoom}>
            Return to Employee Portal
          </button>
        </div>
      </div>
    )
  }

  const questions = examPaper?.questions || []
  const currentQ = questions[currentQIndex]
  const answeredCount = Object.keys(userAnswers).length

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: 'var(--text)', userSelect: 'none', display: 'flex', flexDirection: 'column' }}>
      {/* 1. TOP PROCTORED LIGHT HEADER BAR */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex" style={{ gap: 16, alignItems: 'center' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <ShieldAlert size={16} color="#dc2626" />
            <span>AI PROCTORED LOCKDOWN ACTIVE</span>
          </div>

          <div style={{ height: 20, width: 1, background: '#cbd5e1' }} />

          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              {examPaper?.course_title || 'Proctored Examination'}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>
              Candidate: <strong>{user?.name || 'Employee'}</strong> ({user?.employee_code || user?.email})
            </div>
          </div>
        </div>

        {/* Right Status Counters & 10-Chances Tracker */}
        <div className="flex" style={{ gap: 16, alignItems: 'center' }}>
          {/* Strikes / Violations Badge */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 12,
              background: violationsCount > 0 ? '#fef2f2' : '#ecfdf5',
              border: violationsCount > 0 ? '1px solid #fca5a5' : '1px solid #a7f3d0',
              color: violationsCount > 0 ? '#dc2626' : '#059669',
              fontSize: 12.5,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Eye size={16} />
            <span>Strikes / Pauses: {violationsCount} / {MAX_PAUSES}</span>
          </div>

          {/* Countdown Timer Badge */}
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 12,
              background: isPaused ? '#fef3c7' : timeLeft < 180 ? '#fef2f2' : '#f0f9ff',
              border: isPaused ? '1px solid #fde68a' : timeLeft < 180 ? '1px solid #fca5a5' : '1px solid #bae6fd',
              color: isPaused ? '#d97706' : timeLeft < 180 ? '#dc2626' : '#0284c7',
              fontWeight: 800,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isPaused ? <Pause size={16} color="#d97706" /> : <Clock size={16} color={timeLeft < 180 ? '#dc2626' : '#0284c7'} />}
            <span>{isPaused ? 'PAUSED' : timeStr}</span>
          </div>

          <button className="btn-ghost btn-sm flex" style={{ gap: 6, color: '#ef4444', fontWeight: 700 }} onClick={exitRoom}>
            <LogOut size={15} /> <span>Exit Exam</span>
          </button>
        </div>
      </header>

      {/* MAIN EXAM CONTENT BODY */}
      <main style={{ flex: 1, maxWidth: 1180, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        {examResult ? (
          /* RESULT SCREEN CERTIFICATE CARD */
          <div
            className="card fade-in"
            style={{
              maxWidth: 580,
              margin: '40px auto',
              padding: 44,
              borderRadius: 24,
              background: '#ffffff',
              border: examResult.passed ? '2px solid #a7f3d0' : '2px solid #fca5a5',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: examResult.passed ? '#ecfdf5' : '#fef2f2',
                color: examResult.passed ? '#059669' : '#dc2626',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 20px',
                border: examResult.passed ? '3px solid #a7f3d0' : '3px solid #fca5a5',
              }}
            >
              {examResult.passed ? <Award size={44} /> : <AlertTriangle size={44} />}
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {examResult.passed ? 'Proctored Examination Passed!' : 'Exam Attempt Complete: Not Passed'}
            </h2>

            <p style={{ fontSize: 14.5, color: '#64748b', marginTop: 10 }}>
              {examPaper?.course_title}
            </p>

            <div
              style={{
                padding: '20px',
                margin: '24px 0',
                background: '#f8fafc',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: 13, textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Verified Final Score
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: examResult.passed ? '#059669' : '#dc2626',
                  lineHeight: 1.1,
                  marginTop: 6,
                }}
              >
                {examResult.score}%
              </div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 6 }}>
                Passing Threshold Required: {examResult.pass_mark}%
              </div>
            </div>

            <button
              className="btn-primary btn-block"
              style={{ height: 48, borderRadius: 12, fontSize: 15, fontWeight: 800 }}
              onClick={exitRoom}
            >
              Return to Employee Portal
            </button>
          </div>
        ) : (
          /* QUESTION ANSWERING INTERFACE */
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28 }}>
            {/* QUESTION NAVIGATOR SIDEBAR */}
            <div
              className="card"
              style={{
                padding: 24,
                borderRadius: 20,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                height: 'fit-content',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 16, letterSpacing: '0.05em' }}>
                Question Navigator
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {questions.map((q, idx) => {
                  const isCurrent = currentQIndex === idx
                  const isAnswered = userAnswers[q.id] !== undefined
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      style={{
                        height: 42,
                        borderRadius: 10,
                        fontWeight: 800,
                        fontSize: 14,
                        border: isCurrent
                          ? '2px solid var(--brand-500)'
                          : isAnswered
                          ? '1px solid #a7f3d0'
                          : '1px solid #cbd5e1',
                        background: isCurrent
                          ? 'var(--brand-gradient)'
                          : isAnswered
                          ? '#ecfdf5'
                          : '#f8fafc',
                        color: isCurrent ? '#ffffff' : isAnswered ? '#047857' : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', fontSize: 12.5, color: '#64748b' }}>
                <div className="flex row-between mb-2">
                  <span>Answered:</span>
                  <strong style={{ color: '#059669' }}>{answeredCount} / {questions.length}</strong>
                </div>
                <div className="flex row-between">
                  <span>Remaining:</span>
                  <strong style={{ color: '#dc2626' }}>{questions.length - answeredCount}</strong>
                </div>
              </div>
            </div>

            {/* MAIN QUESTION CARD */}
            <div
              className="card"
              style={{
                padding: 36,
                borderRadius: 24,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <div className="flex row-between" style={{ alignItems: 'center' }}>
                <Badge variant="badge-blue" style={{ fontSize: 12, padding: '4px 12px' }}>
                  Question {currentQIndex + 1} of {questions.length}
                </Badge>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Marks: <strong>{currentQ?.marks || 1} Pt</strong>
                </div>
              </div>

              {/* Question Text */}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
                {currentQ?.question}
              </h2>

              {/* Options List */}
              <div className="stack" style={{ gap: 12, marginTop: 8 }}>
                {(currentQ?.options || []).map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === optIdx
                  return (
                    <label
                      key={optIdx}
                      className="flex"
                      style={{
                        gap: 14,
                        padding: '16px 20px',
                        borderRadius: 14,
                        border: isSelected ? '2px solid var(--brand-500)' : '1px solid #e2e8f0',
                        background: isSelected ? 'var(--brand-50)' : '#f8fafc',
                        cursor: 'pointer',
                        fontSize: 15,
                        color: isSelected ? 'var(--brand-700)' : '#334155',
                        fontWeight: isSelected ? 700 : 400,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q_${currentQ.id}`}
                        checked={isSelected}
                        onChange={() => setUserAnswers({ ...userAnswers, [currentQ.id]: optIdx })}
                        style={{ accentColor: 'var(--brand-500)', width: 18, height: 18 }}
                      />
                      <span>{opt}</span>
                    </label>
                  )
                })}
              </div>

              {/* Navigation Controls Footer */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 24,
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <button
                  className="btn-soft flex"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  style={{ gap: 8, padding: '12px 20px', borderRadius: 12 }}
                >
                  <ArrowLeft size={16} /> <span>Previous</span>
                </button>

                <div className="flex" style={{ gap: 12 }}>
                  {currentQIndex < questions.length - 1 ? (
                    <button
                      className="btn-primary flex"
                      onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      style={{ gap: 8, padding: '12px 24px', borderRadius: 12, fontWeight: 800 }}
                    >
                      <span>Next Question</span> <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      className="btn-primary flex"
                      onClick={submitExam}
                      disabled={submitting}
                      style={{
                        gap: 8,
                        padding: '12px 28px',
                        borderRadius: 12,
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>{submitting ? 'Submitting Exam...' : 'Submit Final Exam'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EXAM PAUSED MODAL OVERLAY (Pauses up to 10 times for full-screen exit or tab switches) */}
      <Modal
        open={isPaused}
        onClose={() => {}}
        title="Exam Paused — Security Interruption"
        width={540}
      >
        <div className="stack" style={{ gap: 20, textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto',
              border: '2px solid #fde68a',
            }}
          >
            <Pause size={36} />
          </div>

          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Exam Currently Paused
            </h3>
            <p className="muted mt-2" style={{ fontSize: 14.5 }}>
              Security Alert: <strong>{pauseReason}</strong>. Timer is frozen.
            </p>
          </div>

          <div
            style={{
              padding: '14px 18px',
              background: '#fef2f2',
              borderRadius: 14,
              border: '1px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <ShieldAlert size={18} color="#dc2626" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>
              Pause Warning Strike {violationsCount} of {MAX_PAUSES} • Max {MAX_PAUSES} pauses allowed before auto-submission.
            </span>
          </div>

          <button
            className="btn-primary flex"
            onClick={resumeExam}
            style={{
              width: '100%',
              justifyContent: 'center',
              gap: 8,
              height: 46,
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 14.5,
              background: 'linear-gradient(135deg, #c5307b 0%, #e91e63 100%)',
            }}
          >
            <Play size={18} />
            <span>Re-Engage Full-Screen & Resume Exam</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}

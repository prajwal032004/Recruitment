import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, PlayCircle, CheckCircle2, Clock, FileText, AlertCircle,
  Award, Video, Check, HelpCircle, ShieldCheck, Sparkles, BookOpen, AlertTriangle, Play, Lock, ShieldAlert, Zap, Eye
} from 'lucide-react'
import api, { apiGet, apiPut, apiPost } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge, Avatar, StatCard } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

// Demo Practice Questions for Proctored Exam Demonstration
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
    question: 'Under the proctored anti-cheating policy, what happens if an employee switches tabs 3 times during an exam?',
    options: [
      'The exam time extends by 10 minutes',
      'Nothing happens',
      'Security violation limit is reached (Strike 3/3) and the exam auto-submits immediately',
      'The browser changes theme color to red'
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

// Format duration into clean human-readable text
function formatDurationText(mins) {
  const m = Number(mins) || 0
  if (m <= 0) return 'Duration pending'
  if (m < 1) return `${Math.round(m * 60)} secs`
  if (m < 60) return `${m} mins`
  const hrs = Math.floor(m / 60)
  const remMins = m % 60
  return remMins > 0 ? `${hrs} hr ${remMins} mins` : `${hrs} hr${hrs > 1 ? 's' : ''}`
}

// Format seconds into MM:SS
function formatTime(sec) {
  const s = Math.floor(sec || 0)
  const m = Math.floor(s / 60)
  const remSec = s % 60
  return `${m}:${remSec < 10 ? '0' : ''}${remSec}`
}

// Extract YouTube ID from various YouTube URL formats
function extractYouTubeId(url) {
  if (!url) return null
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1]?.split('&')[0]
  }
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0]
  }
  if (url.includes('youtube.com/embed/')) {
    return url.split('embed/')[1]?.split('?')[0]
  }
  return null
}

export default function MyTrainings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState('All') // 'All', 'Assigned', 'In Progress', 'Completed'
  const { data: rawAssignments, loading, error, refetch } = useFetch('/training/my-trainings')

  // Local state for assignments so card progress bars update live without page flicker
  const [localAssignments, setLocalAssignments] = useState([])

  useEffect(() => {
    const list = Array.isArray(rawAssignments) ? rawAssignments : (rawAssignments?.items || [])
    setLocalAssignments(list)
  }, [rawAssignments])

  // Video Modal State
  const [videoModal, setVideoModal] = useState(false)
  const [selectedAssign, setSelectedAssign] = useState(null)
  const videoRef = useRef(null)
  const ytPlayerRef = useRef(null)
  const ytIntervalRef = useRef(null)
  const maxWatchedTimeRef = useRef(0)
  const lastWarningTimeRef = useRef(0)
  const lastSyncTimeRef = useRef(0)
  const lastSyncPctRef = useRef(-1)

  // Exam Modal & Proctored Anti-Cheating State
  const [examModal, setExamModal] = useState(false)
  const [examPaper, setExamPaper] = useState(null)
  const [examLoading, setExamLoading] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [examResult, setExamResult] = useState(null)
  const [submittingExam, setSubmittingExam] = useState(false)

  const [isExamActive, setIsExamActive] = useState(false)
  const [violationsCount, setViolationsCount] = useState(0)

  // Auto-update course duration in database silently if auto-detected from video
  const detectAndUpdateDuration = async (seconds) => {
    if (!seconds || seconds <= 0 || !selectedAssign?.course_id) return
    const computedMins = Math.max(1, Math.ceil(seconds / 60))
    if (selectedAssign.duration_minutes !== computedMins) {
      setSelectedAssign((prev) => (prev ? { ...prev, duration_minutes: computedMins } : null))
      setLocalAssignments((prevList) =>
        prevList.map((item) =>
          item.course_id === selectedAssign.course_id ? { ...item, duration_minutes: computedMins } : item
        )
      )
      try {
        await apiPut(`/training/courses/${selectedAssign.course_id}`, {
          duration_minutes: computedMins,
        })
      } catch (e) {
        // silent background sync
      }
    }
  }

  // Silent Throttled Video Progress Sync + Live State Update
  const syncVideoProgress = async (pct, currentSecs, force = false) => {
    if (!selectedAssign || selectedAssign.id === 0) return
    const now = Date.now()

    const hasQuestions = (selectedAssign.question_count || 0) > 0
    const isAutoCompleted = !hasQuestions && pct >= 95
    const newStatus = isAutoCompleted ? 'Completed' : (selectedAssign.status === 'Assigned' && pct > 0 ? 'In Progress' : selectedAssign.status)

    // Real-time local state update so card & modal progress bars update smoothly
    setSelectedAssign((prev) =>
      prev
        ? {
            ...prev,
            watched_percent: pct,
            last_position_seconds: currentSecs,
            status: newStatus,
          }
        : null
    )

    setLocalAssignments((prevList) =>
      prevList.map((item) =>
        item.id === selectedAssign.id
          ? {
              ...item,
              watched_percent: pct,
              last_position_seconds: currentSecs,
              status: newStatus,
            }
          : item
      )
    )

    if (!force && now - lastSyncTimeRef.current < 4000 && pct === lastSyncPctRef.current) {
      return
    }
    lastSyncTimeRef.current = now
    lastSyncPctRef.current = pct

    try {
      await apiPut(`/training/assignments/${selectedAssign.id}/progress`, {
        watched_percent: pct,
        last_position_seconds: currentSecs,
      })
    } catch (e) {
      // silent background sync failure
    }
  }

  // Close Video Modal cleanly and refresh cards ONCE upon closing
  const closeVideoModal = () => {
    const curSecs = Math.floor(maxWatchedTimeRef.current || 0)
    let dur = 1
    if (videoRef.current && videoRef.current.duration) {
      dur = videoRef.current.duration
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.getDuration === 'function') {
      dur = ytPlayerRef.current.getDuration() || 1
    }
    const finalPct = Math.min(100, Math.round((curSecs / dur) * 100))

    syncVideoProgress(finalPct, curSecs, true)
    setVideoModal(false)
    refetch()
  }

  // Dynamically load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      } else {
        document.head.appendChild(tag)
      }
    }
  }, [])

  // Initialize YouTube IFrame Player when videoModal opens with a YouTube video
  useEffect(() => {
    if (!videoModal || !selectedAssign) {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current)
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try { ytPlayerRef.current.destroy() } catch (e) {}
        ytPlayerRef.current = null
      }
      return
    }

    const ytId = extractYouTubeId(selectedAssign.video_url)
    if (!ytId) return

    const initYT = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initYT, 300)
        return
      }

      try {
        ytPlayerRef.current = new window.YT.Player('yt-player-element', {
          height: '100%',
          width: '100%',
          videoId: ytId,
          playerVars: {
            autoplay: 1,
            start: Math.floor(selectedAssign.last_position_seconds || 0),
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (evt) => {
              const durSecs = evt.target.getDuration()
              if (durSecs) detectAndUpdateDuration(durSecs)
              const startSecs = selectedAssign.last_position_seconds || 0
              if (startSecs > 0) evt.target.seekTo(startSecs, true)
            },
            onStateChange: (evt) => {
              if (evt.data === window.YT.PlayerState.PLAYING || evt.data === window.YT.PlayerState.BUFFERING) {
                if (!ytIntervalRef.current) {
                  ytIntervalRef.current = setInterval(handleYTProgress, 400)
                }
              } else {
                if (ytIntervalRef.current) {
                  clearInterval(ytIntervalRef.current)
                  ytIntervalRef.current = null
                }
              }
            },
          },
        })
      } catch (e) {
        // fallback
      }
    }

    setTimeout(initYT, 250)

    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current)
    }
  }, [videoModal, selectedAssign])

  const handleYTProgress = () => {
    if (!ytPlayerRef.current || typeof ytPlayerRef.current.getCurrentTime !== 'function') return
    const cur = ytPlayerRef.current.getCurrentTime() || 0
    const dur = ytPlayerRef.current.getDuration() || 0
    if (!dur || dur <= 5) return

    const maxW = maxWatchedTimeRef.current || 0

    if (dur > 0) detectAndUpdateDuration(dur)

    // Strict 2-Minute & 1-Minute Anti-Skipping Guard for YouTube
    if (cur > maxW + 120) {
      ytPlayerRef.current.seekTo(maxW, true)
      if (Date.now() - lastWarningTimeRef.current > 2000) {
        toast.error('Skipping forward by more than 2 minutes is not allowed. Position reset to highest watched point.')
        lastWarningTimeRef.current = Date.now()
      }
      return
    }

    if (cur > maxW + 60) {
      ytPlayerRef.current.seekTo(maxW, true)
      if (Date.now() - lastWarningTimeRef.current > 2000) {
        toast.error('Fast-forwarding is restricted to a maximum of 1 minute ahead. Reverting to watched position.')
        lastWarningTimeRef.current = Date.now()
      }
      return
    }

    if (cur > maxW) {
      maxWatchedTimeRef.current = cur
    }

    const pct = Math.min(100, Math.floor((maxWatchedTimeRef.current / dur) * 100))
    syncVideoProgress(pct, Math.floor(maxWatchedTimeRef.current))
  }

  // Calculations for Hero Banner Stats
  const totalCount = localAssignments.length

  const completedCount = localAssignments.filter((item) => {
    const hasQuestions = (item.question_count || 0) > 0
    const isAutoCompleted = !hasQuestions && (item.watched_percent || 0) >= 95
    return item.status === 'Completed' || isAutoCompleted
  }).length

  const inProgressCount = localAssignments.filter((item) => {
    const hasQuestions = (item.question_count || 0) > 0
    const isAutoCompleted = !hasQuestions && (item.watched_percent || 0) >= 95
    const isCompleted = item.status === 'Completed' || isAutoCompleted
    return item.status === 'In Progress' && !isCompleted
  }).length

  const overdueCount = localAssignments.filter((item) => {
    const hasQuestions = (item.question_count || 0) > 0
    const isAutoCompleted = !hasQuestions && (item.watched_percent || 0) >= 95
    const isCompleted = item.status === 'Completed' || isAutoCompleted
    return item.status === 'Overdue' && !isCompleted
  }).length

  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100

  const filtered = localAssignments.filter((item) => {
    const hasQuestions = (item.question_count || 0) > 0
    const isAutoCompleted = !hasQuestions && (item.watched_percent || 0) >= 95
    const isCompleted = item.status === 'Completed' || isAutoCompleted
    const isOverdue = item.status === 'Overdue' && !isCompleted
    const isProgress = item.status === 'In Progress' && !isCompleted

    if (tab === 'Assigned') return (item.status === 'Assigned' || isOverdue) && !isCompleted
    if (tab === 'In Progress') return isProgress
    if (tab === 'Completed') return isCompleted
    return true
  })

  // Open Video Player Modal
  const openVideo = (item) => {
    setSelectedAssign(item)
    maxWatchedTimeRef.current = item.last_position_seconds || 0
    lastSyncTimeRef.current = 0
    lastSyncPctRef.current = -1
    setVideoModal(true)
  }

  // Open Proctored Demo Test Room
  const openDemoExam = () => {
    navigate('/app/exam/demo')
  }

  // Set resume position when HTML5 video metadata loads
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      if (selectedAssign?.last_position_seconds) {
        videoRef.current.currentTime = selectedAssign.last_position_seconds
        maxWatchedTimeRef.current = selectedAssign.last_position_seconds
      }
      if (videoRef.current.duration) {
        detectAndUpdateDuration(videoRef.current.duration)
      }
    }
  }

  // Smart Anti-Seeking Enforcement for HTML5 Video (Max 1-Minute / 60-Second Forward Skip)
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime || 0
    const dur = videoRef.current.duration || 0
    if (!dur || dur <= 5) return

    const maxW = maxWatchedTimeRef.current || 0

    if (dur > 0) detectAndUpdateDuration(dur)

    if (cur > maxW + 120) {
      videoRef.current.currentTime = maxW
      if (Date.now() - lastWarningTimeRef.current > 2000) {
        toast.error('Skipping forward by more than 2 minutes is not allowed. Position reset to highest watched point.')
        lastWarningTimeRef.current = Date.now()
      }
      return
    }

    if (cur > maxW + 60) {
      videoRef.current.currentTime = maxW
      if (Date.now() - lastWarningTimeRef.current > 2000) {
        toast.error('Fast-forwarding is restricted to a maximum of 1 minute ahead. Reverting to watched position.')
        lastWarningTimeRef.current = Date.now()
      }
      return
    }

    if (cur > maxW) {
      maxWatchedTimeRef.current = cur
    }

    const pct = Math.min(100, Math.floor((maxWatchedTimeRef.current / dur) * 100))
    syncVideoProgress(pct, Math.floor(maxWatchedTimeRef.current))
  }

  // Open Proctored Exam Room
  const openExam = (item) => {
    navigate(`/app/exam/${item.id}`)
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* 1. Employee Welcome Hero Banner */}
      <div
        className="card mb-8 fade-in"
        style={{
          padding: '32px 36px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #831843 100%)',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <div className="flex" style={{ gap: 20, alignItems: 'center' }}>
          <Avatar
            name={user?.name || 'Employee'}
            src={user?.profile_image}
            size={76}
            style={{
              fontSize: 28,
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 24px rgba(197, 48, 123, 0.4)',
            }}
          />
          <div>
            <div className="flex" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f472b6' }}>
                Employee Portal
              </span>
              <Sparkles size={16} color="#f472b6" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Welcome back, {user?.name || 'Employee'}!
            </h1>
            <div className="flex wrap mt-2" style={{ gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, color: '#94a3b8' }}>
                Code: <strong style={{ color: '#38bdf8' }}>{user?.employee_code || user?.email}</strong>
              </span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ fontSize: 13.5, color: '#cbd5e1' }}>
                {user?.designation || 'Team Member'} {user?.department ? `(${user.department})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Actions & Progress Ring */}
        <div className="flex wrap" style={{ gap: 16, alignItems: 'center' }}>
          <button
            className="btn flex"
            style={{
              gap: 8,
              padding: '12px 20px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 13.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
            onClick={openDemoExam}
          >
            <ShieldAlert size={18} color="#f472b6" />
            <span>Try Proctored Demo Exam</span>
          </button>

          <div
            style={{
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overall Compliance
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: overallPct >= 80 ? '#4ade80' : '#fbbf24', lineHeight: 1.1 }}>
                {overallPct}%
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                {completedCount} of {totalCount} completed
              </div>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: `conic-gradient(#ec4899 ${overallPct * 3.6}deg, rgba(255,255,255,0.15) 0deg)`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f172a', display: 'grid', placeItems: 'center' }}>
                <Award size={16} color="#ec4899" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid-stats mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <StatCard icon={BookOpen} label="Total Assigned" value={totalCount} sub="Curated learning tracks" tone="brand" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedCount} sub="Exams passed successfully" tone="green" />
        <StatCard icon={Clock} label="In Progress" value={inProgressCount} sub="Active learning modules" tone="blue" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueCount} sub="Requires immediate completion" tone="red" />
      </div>

      {/* 3. Floating Glassmorphism Tab Bar */}
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
        {[
          { key: 'All', label: `All Trainings (${localAssignments.length})`, icon: GraduationCap },
          { key: 'Assigned', label: `Action Required (${localAssignments.filter((a) => a.status === 'Assigned' || a.status === 'Overdue').length})`, icon: AlertCircle },
          { key: 'In Progress', label: `In Progress (${inProgressCount})`, icon: Clock },
          { key: 'Completed', label: `Completed (${completedCount})`, icon: CheckCircle2 },
        ].map((t) => {
          const Icon = t.icon
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="btn flex"
              style={{
                flex: 1,
                minWidth: 170,
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 800,
                background: isActive ? 'var(--brand-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-2)',
                boxShadow: isActive ? '0 6px 20px rgba(197, 48, 123, 0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={17} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* 4. Spacious Course Cards Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No training courses found"
          message={tab === 'All' ? 'You currently have no mandatory trainings assigned to your employee account.' : `No courses match the '${tab}' status filter.`}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 26 }}>
          {filtered.map((item) => {
            const watchedPct = item.watched_percent || 0
            const hasQuestions = (item.question_count || 0) > 0
            const isAutoCompleted = !hasQuestions && watchedPct >= 95
            const isCompleted = item.status === 'Completed' || isAutoCompleted
            const isOverdue = item.status === 'Overdue' && !isCompleted
            const isProgress = item.status === 'In Progress' && !isCompleted
            const displayStatus = isCompleted ? 'Completed' : item.status

            return (
              <div
                key={item.id}
                className="card fade-in"
                style={{
                  padding: 28,
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                  border: isOverdue ? '1.5px solid var(--red-400)' : isCompleted ? '1.5px solid #a7f3d0' : '1px solid var(--border)',
                  background: isOverdue ? 'linear-gradient(180deg, #fff 0%, #fef2f2 100%)' : 'var(--surface)',
                }}
              >
                {/* Card Top Badges */}
                <div className="flex row-between" style={{ alignItems: 'center' }}>
                  <Badge
                    variant={
                      item.course_category === 'Security'
                        ? 'badge-red'
                        : item.course_category === 'Compliance'
                        ? 'badge-amber'
                        : item.course_category === 'Technical'
                        ? 'badge-blue'
                        : 'badge-gray'
                    }
                    style={{ fontSize: 12, padding: '4px 12px' }}
                  >
                    {item.course_category || 'General Track'}
                  </Badge>

                  <Badge
                    variant={isCompleted ? 'badge-green' : isOverdue ? 'badge-red' : isProgress ? 'badge-blue' : 'badge-amber'}
                    style={{ fontSize: 12, padding: '4px 12px' }}
                  >
                    {displayStatus}
                  </Badge>
                </div>

                {/* Course Title & Description */}
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: 'var(--text)', lineHeight: 1.3 }}>
                    {item.course_title}
                  </h3>
                  <div className="flex wrap mt-2" style={{ gap: 12, fontSize: 12.5, color: 'var(--text-3)' }}>
                    <span>Cycle: <strong>{item.cycle}</strong></span>
                    <span>•</span>
                    <span style={{ color: isOverdue ? 'var(--red-600)' : 'var(--text-2)', fontWeight: isOverdue ? 700 : 400 }}>
                      Due: <strong>{item.due_date ? item.due_date.slice(0, 10) : 'N/A'}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div style={{ background: 'var(--surface-2)', padding: '14px 16px', borderRadius: 14 }}>
                  <div className="flex row-between mb-2" style={{ fontSize: 12.5, fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-2)' }}>Video Progress</span>
                    <span style={{ color: 'var(--brand-600)' }}>{watchedPct}% watched</span>
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${watchedPct}%`,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, #c5307b, #e91e63)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                  <button
                    className="btn-soft flex"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      gap: 6,
                      padding: '11px',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 13.5,
                    }}
                    onClick={() => openVideo(item)}
                  >
                    <Video size={16} color="var(--brand-600)" />
                    <span>Watch Video</span>
                  </button>

                  {hasQuestions ? (
                    <button
                      className={`btn-${isCompleted ? 'ghost' : 'primary'} flex`}
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        gap: 6,
                        padding: '11px',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 13.5,
                        background: isCompleted ? '#ecfdf5' : undefined,
                        color: isCompleted ? '#047857' : undefined,
                        border: isCompleted ? '1px solid #a7f3d0' : undefined,
                      }}
                      onClick={() => openExam(item)}
                    >
                      {isCompleted ? <CheckCircle2 size={16} color="#059669" /> : <FileText size={16} />}
                      <span>{isCompleted ? 'Passed Exam' : 'Take Exam'}</span>
                    </button>
                  ) : (
                    <button
                      className="btn-ghost flex"
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        gap: 6,
                        padding: '11px',
                        borderRadius: 12,
                        opacity: 0.6,
                        cursor: 'not-allowed',
                      }}
                      disabled
                      title="Exam questions have not been uploaded by HR yet"
                    >
                      <HelpCircle size={16} color="#94a3b8" />
                      <span style={{ fontSize: 12.5, color: '#64748b' }}>No Exam Uploaded</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* --- IN-APP VIDEO PLAYER MODAL WITH LIVE PROGRESS VISUALIZER --- */}
      <Modal
        open={videoModal}
        onClose={closeVideoModal}
        title={`Video Module: ${selectedAssign?.course_title || ''}`}
        width={800}
      >
        {selectedAssign && (
          <div className="stack" style={{ gap: 18 }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000', borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}>
              {extractYouTubeId(selectedAssign.video_url) ? (
                <div id="yt-player-element" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
              ) : (
                <video
                  ref={videoRef}
                  src={selectedAssign.video_url}
                  controls
                  autoPlay
                  onLoadedMetadata={handleVideoLoaded}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onSeeking={handleVideoTimeUpdate}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>

            {/* LIVE IN-MODAL VIDEO PROGRESS TRACKER */}
            <div style={{ background: 'var(--surface-2)', padding: 18, borderRadius: 16, border: '1px solid var(--border)' }}>
              <div className="flex row-between mb-2" style={{ alignItems: 'center' }}>
                <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                  <PlayCircle size={16} color="var(--brand-600)" />
                  <span style={{ fontWeight: 800, fontSize: 14 }}>Real-Time Video Progress</span>
                </div>
                <Badge variant="badge-brand" style={{ fontSize: 12, padding: '4px 12px', fontWeight: 800 }}>
                  {selectedAssign.watched_percent || 0}% Watched
                </Badge>
              </div>

              {/* Animated Progress Bar */}
              <div style={{ height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', margin: '10px 0' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${selectedAssign.watched_percent || 0}%`,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #c5307b, #e91e63)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div className="flex row-between" style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 8 }}>
                <span>Watched Position: <strong>{formatTime(selectedAssign.last_position_seconds)}</strong></span>
                <span>Est. Duration: <strong>{formatDurationText(selectedAssign.duration_minutes)}</strong></span>
              </div>
            </div>

            <div className="flex row-between" style={{ alignItems: 'center', paddingTop: 6 }}>
              <div className="flex" style={{ gap: 8, alignItems: 'center', fontSize: 12.5, color: '#64748b' }}>
                <Lock size={14} color="#64748b" />
                <span>Anti-skipping active (Max 1 minute forward jump permitted)</span>
              </div>

              <button className="btn-primary btn-sm" onClick={closeVideoModal}>
                Save & Close Player
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

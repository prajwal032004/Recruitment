import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarClock, CheckCircle, XCircle, Star, MessageSquare, Award, Clock } from 'lucide-react'
import { apiGet } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner, Avatar, Badge } from '../../components/UI'

export default function ManagerInterviews() {
  const { deptSlug } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState([])

  useEffect(() => {
    let active = true
    async function loadInterviews() {
      setLoading(true)
      try {
        const stats = await apiGet('/manager/dashboard-stats')
        if (active) {
          setInterviews(stats.recent_interviews || [])
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load interview history.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadInterviews()
    return () => { active = false }
  }, [slug])

  if (loading) return <LoadingSpinner full label="Loading Interview Evaluations & Metrics..." />

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* Top Banner */}
      <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Interview Evaluations & Feedback Audit
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 0 0', color: '#0f172a' }}>
          Department Interview Evaluations & Verdicts
        </h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
          Full traceability of multi-round interview ratings, comments, and automated Pass/Fail verdicts
        </div>
      </div>

      {/* Interviews List Table */}
      <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff' }}>
        {interviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12 }}>
            <CalendarClock size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
            <h3 style={{ margin: 0, fontSize: 16, color: '#334155' }}>No Interview Evaluations Recorded Yet</h3>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#64748b' }}>
              Scheduled interview rounds and pass/fail evaluation decisions will appear here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: 11 }}>
                  <th style={{ padding: '12px 16px' }}>Candidate & Position</th>
                  <th>Interview Round</th>
                  <th>Scheduled Date / Mode</th>
                  <th>Interviewer Assigned</th>
                  <th>Evaluation Verdict</th>
                  <th>Feedback Rating</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map(iv => (
                  <tr key={iv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{iv.candidate_name || 'Candidate'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{iv.job_title || 'Position'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#312e81' }}>{iv.round_name}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: '#334155' }}>
                        {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : 'Scheduled'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{iv.mode}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#475569' }}>
                        {(iv.interviewers || []).map(i => i.name).join(', ') || 'Recruitment Staff'}
                      </span>
                    </td>
                    <td>
                      <Badge variant={iv.result === 'Pass' ? 'badge-green' : iv.result === 'Fail' ? 'badge-red' : 'badge-yellow'}>
                        {iv.result || 'Pending'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#f59e0b' }}>
                        <Star size={16} fill="#f59e0b" color="#f59e0b" />
                        <span>{iv.feedback_count > 0 ? '5.0 / 5' : 'Pending'}</span>
                      </div>
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

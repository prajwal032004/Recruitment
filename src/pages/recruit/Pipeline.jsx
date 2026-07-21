import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { KanbanSquare, Filter, RotateCcw } from 'lucide-react'
import { apiGet, apiPut, apiPost } from '../../api/client'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'
import { useFetch } from '../../components/hooks'

function matchColor(score) {
  if (score == null) return { background: 'var(--gray-50)', color: 'var(--gray-700)' }
  if (score >= 61) return { background: 'var(--green-50)', color: 'var(--green-700)' }
  if (score >= 41) return { background: 'var(--amber-50)', color: 'var(--amber-700)' }
  if (score >= 21) return { background: 'var(--blue-50)', color: 'var(--blue-700)' }
  return { background: 'var(--red-50)', color: 'var(--red-700)' }
}
function eligBadge(s) {
  if (['Highly Preferable', 'Preferable', 'Eligible'].includes(s)) return 'badge-green'
  if (['Considerable', 'Needs Review'].includes(s)) return 'badge-amber'
  if (['Relevant'].includes(s)) return 'badge-blue'
  return 'badge-red'
}

export default function Pipeline() {
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [filters, setFilters] = useState({ source: '', job_id: '' })
  const [showRejected, setShowRejected] = useState(true)
  const [contextMenu, setContextMenu] = useState(null)
  const [joinedMoveConfirm, setJoinedMoveConfirm] = useState(null)
  
  const toast = useToast()
  const nav = useNavigate()
  const { data: jobsData } = useFetch('/jds')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const qs = new URLSearchParams()
      if (filters.source) qs.set('source', filters.source)
      if (filters.job_id) qs.set('job_id', filters.job_id)
      setBoard(await apiGet(`/pipeline/board?${qs.toString()}`))
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const executeDrop = async (id, stage) => {
    try {
      const isRejectedCard = (board?.terminal?.Rejected || []).some(r => r.id === id) || (board?.terminal?.['On Hold'] || []).some(o => o.id === id)
      if (isRejectedCard) {
        await apiPost(`/applications/${id}/undo-reject`)
      }
      await apiPut(`/applications/${id}/stage`, { stage, status: 'Active' })
      toast.success(`Moved to ${stage}`)
      load()
    } catch (e) { 
      toast.error(e.message)
      load() 
    }
  }

  const drop = async (stage) => {
    if (!dragId) return
    const id = dragId; setDragId(null)

    // Check if the current stage of this dragged item is 'Joined'
    let currentStage = null
    if (board && board.columns) {
      for (const st of Object.keys(board.columns)) {
        if (board.columns[st].some(a => a.id === id)) {
          currentStage = st
          break
        }
      }
    }

    if (currentStage === 'Joined' && stage !== 'Joined') {
      setJoinedMoveConfirm({ id, stage })
      return
    }

    await executeDrop(id, stage)
  }

  const dropToRejected = async () => {
    if (!dragId) return
    const id = dragId; setDragId(null)
    try {
      await apiPut(`/applications/${id}/stage`, { status: 'Rejected' })
      toast.success('Candidate moved to Rejected')
      load()
    } catch (e) {
      toast.error(e.message)
      load()
    }
  }

  const handleContextMenu = (e, app, candId) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      appId: app.id,
      candId: candId,
      name: app.candidate_name
    })
  }

  const handleDelete = async (candId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete candidate ${name}?`)) return
    try {
      await apiDelete(`/candidates/${candId}`)
      toast.success(`Candidate ${name} deleted successfully`)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading && !board) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={load} />

  const total = Object.values(board?.counts || {}).reduce((a, b) => a + b, 0)
  const rejectedList = board?.terminal?.Rejected || []

  return (
    <div style={{ position: 'relative' }}>
      <PageHeader title="Recruitment Pipeline" subtitle="Drag candidates between stages. Full history is preserved." icon={KanbanSquare} />

      <div className="card flex wrap" style={{ gap: 12, padding: '16px 20px', marginBottom: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-600)', fontWeight: 600, fontSize: 13, background: 'var(--brand-50)', padding: '8px 12px', borderRadius: 8 }}>
          <Filter size={16} /> Filters
        </div>
        <select className="select" style={{ width: 160, background: 'var(--surface-2)' }} value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
          <option value="">All sources</option>
          <option value="CAREERS">Careers Portal</option>
          <option value="COLLEGE">Campus Drive</option>
          <option value="DIRECT">Direct Upload</option>
          <option value="REFERRAL">Referral</option>
        </select>
        <select className="select" style={{ minWidth: 160, flex: 1, background: 'var(--surface-2)' }} value={filters.job_id}
          onChange={(e) => setFilters({ ...filters, job_id: e.target.value })}>
          <option value="">All jobs</option>
          {(jobsData?.items || []).map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <button 
          className="btn-soft" 
          style={{ padding: '8px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} 
          onClick={() => setShowRejected(!showRejected)}
        >
          {showRejected ? 'Hide' : 'Show'} Rejected ({rejectedList.length})
        </button>
        <div className="badge badge-blue" style={{ padding: '6px 12px', fontSize: 13 }}>
          {total} active in pipeline
        </div>
      </div>

      {showRejected && (
        <div 
          className="card mb-6" 
          onDragOver={(e) => e.preventDefault()}
          onDrop={dropToRejected}
          style={{ 
            background: 'rgba(254, 242, 242, 0.4)', 
            border: '2px dashed #fecaca', 
            padding: '16px 20px', 
            borderRadius: 12,
            transition: 'all 0.2s ease'
          }}
        >
          <div className="row-between mb-3">
            <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }}></span>
              Rejected Candidates (Drag here to reject / Drag out to restore)
            </div>
            <div className="muted" style={{ fontSize: 12 }}>Right-click card for options</div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, minHeight: 90 }}>
            {rejectedList.length === 0 ? (
              <div className="muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontSize: 13 }}>
                No rejected candidates. Drag active cards here to reject.
              </div>
            ) : (
              rejectedList.map((a) => (
                <div 
                  key={a.id}
                  draggable
                  onDragStart={() => setDragId(a.id)}
                  onDragEnd={() => setDragId(null)}
                  onContextMenu={(e) => handleContextMenu(e, a, a.candidate_id)}
                  onClick={() => nav(`/app/applications/${a.id}`)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid #fca5a5',
                    borderRadius: 8,
                    padding: '10px 14px',
                    minWidth: 200,
                    cursor: 'grab',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {a.candidate_name}
                    <button 
                      className="muted" 
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontWeight: 900 }}
                      onClick={(e) => { e.stopPropagation(); handleContextMenu(e, a, a.candidate_id) }}
                    >
                      ⋮
                    </button>
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{a.job_title}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {total === 0 ? (
        <EmptyState icon={KanbanSquare} title="No candidates in the pipeline"
          message="Applications from Careers and college submissions will appear here automatically." />
      ) : (
        <div className="kanban">
          {board.stages.map((stage) => (
            <div key={stage} className="kcol"
              onDragOver={(e) => e.preventDefault()} onDrop={() => drop(stage)}>
              <div className="kcol-head">{stage}<span className="kcol-count">{board.counts[stage]}</span></div>
              <div className="kcol-body">
                {board.columns[stage].map((a) => (
                  <div key={a.id} className={`kcard ${dragId === a.id ? 'dragging' : ''}`} draggable
                    onDragStart={() => setDragId(a.id)} onDragEnd={() => setDragId(null)}
                    onContextMenu={(e) => handleContextMenu(e, a, a.candidate_id)}
                    onClick={() => nav(`/app/applications/${a.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="kcard-name">{a.candidate_name}</div>
                      <button 
                        className="muted" 
                        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontWeight: 900 }}
                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e, a, a.candidate_id) }}
                      >
                        ⋮
                      </button>
                    </div>
                    <div className="kcard-role">{a.job_title}</div>
                    <div className="kcard-meta">
                      <span className="match-pill" style={matchColor(a.match_score)}>{a.match_score != null ? `${a.match_score}%` : 'N/A'}</span>
                      <Badge variant={eligBadge(a.eligibility_status)}>{a.eligibility_status || '—'}</Badge>
                      <Badge variant="badge-gray">{a.source}</Badge>
                    </div>
                  </div>
                ))}
                {board.columns[stage].length === 0 && <div className="muted" style={{ padding: 8, fontSize: 12 }}>Drop here</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {contextMenu && (
        <div 
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 99999,
            padding: '6px 0',
            minWidth: 160
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="btn-ghost" 
            style={{ width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 0, color: 'var(--text)' }}
            onClick={() => {
              setContextMenu(null)
              nav(`/app/applications/${contextMenu.appId}`)
            }}
          >
            View Profile
          </button>
          <button 
            className="btn-ghost" 
            style={{ width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red-600)', borderRadius: 0 }}
            onClick={() => {
              setContextMenu(null)
              handleDelete(contextMenu.candId, contextMenu.name)
            }}
          >
            Delete Candidate
          </button>
        </div>
      )}

      {joinedMoveConfirm && (
        <JoinedConfirmModal 
          onConfirm={() => {
            executeDrop(joinedMoveConfirm.id, joinedMoveConfirm.stage)
            setJoinedMoveConfirm(null)
          }}
          onCancel={() => setJoinedMoveConfirm(null)}
        />
      )}
    </div>
  )
}

function JoinedConfirmModal({ onConfirm, onCancel }) {
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    if (seconds <= 0) {
      onCancel()
      return
    }
    const timer = setTimeout(() => {
      setSeconds(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [seconds, onCancel])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000
    }}>
      <div className="card card-pad" style={{ width: 400, textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--red-600)' }}>Warning: Candidate Joined</h3>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          This candidate has already reached the final <strong>Joined</strong> stage. Are you sure you want to move them back?
        </p>
        <div className="flex" style={{ gap: 12, justifyContent: 'center' }}>
          <button 
            className="btn-soft" 
            style={{ padding: '10px 20px', fontWeight: 600 }}
            onClick={onCancel}
          >
            No (Auto-cancel in {seconds}s)
          </button>
          <button 
            className="btn-danger" 
            style={{ padding: '10px 20px', fontWeight: 600 }}
            onClick={onConfirm}
          >
            Yes, Move Back
          </button>
        </div>
      </div>
    </div>
  )
}

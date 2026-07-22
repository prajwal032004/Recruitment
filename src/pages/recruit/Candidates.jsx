import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Star, CheckCircle2, PauseCircle, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import { apiGet, apiPut, apiPost, apiDelete, baseURL } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Badge, Avatar, Pagination } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'

export default function Candidates() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [source, setSource] = useState('')
  const [pool, setPool] = useState(false)
  const [page, setPage] = useState(1)
  const [hoveredId, setHoveredId] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const toast = useToast()

  const handleDelete = async (c, e) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to permanently delete candidate ${c.name}? This will remove all their applications and histories.`)) return
    setActionLoading(prev => ({ ...prev, [c.id]: 'delete' }))
    try {
      await apiDelete(`/candidates/${c.id}`)
      toast.success(`Candidate ${c.name} deleted successfully.`)
      refetch()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [c.id]: null }))
    }
  }

  // Debounce the search input to prevent race conditions on fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q)
      if (q !== debouncedQ) setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [q, debouncedQ])

  const url = `/candidates?search=${encodeURIComponent(debouncedQ)}&source=${source}&talent_pool=${pool ? 1 : 0}&page=${page}`
  const { data, loading, error, refetch } = useFetch(url, [debouncedQ, source, pool, page])

  const toggle = async (c, e) => {
    e.stopPropagation()
    try { await apiPut(`/candidates/${c.id}/talent-pool`, { in_talent_pool: !c.in_talent_pool }); refetch() }
    catch (err) { toast.error(err.message) }
  }

  const handleStatusAction = async (c, action, e) => {
    e.stopPropagation()
    setActionLoading(prev => ({ ...prev, [c.id]: action }))
    try {
      if (action === 'undo_reject') {
        const res = await apiPost(`/candidates/${c.id}/undo-reject`)
        toast.success(res.stage ? `Candidate restored to ${res.stage} stage!` : 'Rejection undone!')
      } else {
        const res = await apiPut(`/candidates/${c.id}/status`, { action })
        toast.success(action === 'approve' ? 'Candidate approved & shortlisted!' : action === 'on_hold' ? 'Candidate placed on hold!' : 'Candidate marked as rejected!')
      }
      refetch()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [c.id]: null }))
    }
  }

  return (
    <div className="fade-in">
      <PageHeader title="Candidates" subtitle="Master candidate profiles — deduplicated across all sources with quick status actions." icon={Users} />
      
      {/* Filter Bar with better padding and styling */}
      <div className="card flex wrap" style={{ gap: 12, padding: '16px 20px', marginBottom: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 40, background: 'var(--surface-2)' }} placeholder="Search name, email, skills, college"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: 160, background: 'var(--surface-2)' }} value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }}>
          <option value="">All sources</option>
          <option value="CAREERS">Careers Portal</option>
          <option value="COLLEGE">Campus Drive</option>
          <option value="DIRECT">Direct Upload</option>
          <option value="REFERRAL">Referral</option>
        </select>
        <button className={pool ? 'btn-primary' : 'btn-soft'} style={{ padding: '10px 18px' }} onClick={() => { setPool(!pool); setPage(1) }}>
          <Star size={16} fill={pool ? 'currentColor' : 'none'} /> Talent Pool
        </button>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={refetch} /> :
        (data?.items || []).length === 0 ? (
          <EmptyState icon={Users} title="No candidates found" message="Candidates appear here as applications arrive." />
        ) : (
          <>
            <div className="card" style={{ padding: 0 }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>College</th>
                    <th>Branch</th>
                    <th>Skills</th>
                    <th>Source</th>
                    <th>Status & Stage</th>
                    <th style={{ textAlign: 'center' }}>Pool</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => {
                    const app = c.latest_application
                    const isRejected = app && (app.status === 'Rejected' || app.stage === 'Rejected')
                    const isOnHold = app && (app.status === 'On Hold' || app.stage === 'On Hold')
                    const isApproved = app && !isRejected && !isOnHold && app.stage && app.stage !== 'Applied'
                    const isHovered = hoveredId === c.id

                    return (
                      <tr key={c.id} 
                        onClick={() => nav(`/app/candidates/${c.id}`)} 
                        onMouseEnter={() => setHoveredId(c.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{ cursor: 'pointer', background: isHovered ? 'var(--surface-2)' : 'transparent', transition: 'background 0.15s ease' }}>
                        <td><div className="flex">
                          <Avatar name={c.name} src={c.profile_image} size={32} />
                          <div><div style={{ fontWeight: 600 }}>{c.name}</div><div className="muted" style={{ fontSize: 12 }}>{c.email}</div></div></div></td>
                        <td className="muted">{c.college_name || '—'}</td>
                        <td>{c.branch || '—'}</td>
                        <td><div className="flex wrap" style={{ gap: 4 }}>{(c.skills || []).slice(0, 3).map((s) => <span key={s} className="chip-gray chip" style={{ fontSize: 11 }}>{s}</span>)}{c.skills?.length > 3 && <span className="muted">+{c.skills.length - 3}</span>}</div></td>
                        <td><Badge variant="badge-gray">{c.first_source}</Badge></td>
                        <td>
                          {app ? (
                            <div className="stack" style={{ gap: 2 }}>
                              <Badge variant={isRejected ? 'badge-red' : isOnHold ? 'badge-amber' : 'badge-blue'}>
                                {app.stage || app.status}
                              </Badge>
                              <div className="muted" style={{ fontSize: 11 }}>{app.job_title}</div>
                            </div>
                          ) : (
                            <Badge variant="badge-gray">Unassigned</Badge>
                          )}
                        </td>
                        <td onClick={(e) => toggle(c, e)} style={{ textAlign: 'center' }}>
                          <button className="icon-btn" title="Toggle Talent Pool"><Star size={16} fill={c.in_talent_pool ? '#f59e0b' : 'none'} color={c.in_talent_pool ? '#f59e0b' : 'currentColor'} /></button>
                        </td>
                        <td onClick={(e) => handleDelete(c, e)} style={{ textAlign: 'center' }}>
                          <button className="icon-btn" title="Delete Candidate" style={{ color: 'var(--red-600)' }} disabled={actionLoading[c.id] === 'delete'}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} perPage={data.per_page} total={data.total} onPage={setPage} />
          </>
        )}
    </div>
  )
}


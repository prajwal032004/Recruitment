import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Search, Calendar, Filter, RotateCcw, Trash2,
  Download, ExternalLink, CheckCircle2, AlertCircle, Info, Clock,
  ChevronLeft, ChevronRight, X, MailOpen, Mail
} from 'lucide-react'
import { apiGet, apiPut, apiDelete } from '../api/client'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader } from '../components/UI'

function fmtDateTime(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return String(str)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function formatDateHeader(dateStr) {
  if (!dateStr) return 'Earlier'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return 'Earlier'

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isToday = d.toDateString() === today.toDateString()
  const isYesterday = d.toDateString() === yesterday.toDateString()

  if (isToday) return 'Today — ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (isYesterday) return 'Yesterday — ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

function getTypeBadgeProps(typeStr = '') {
  const t = String(typeStr).toLowerCase()
  if (t.includes('interview') || t.includes('schedule')) {
    return { label: typeStr || 'Interview', bg: '#eff6ff', color: '#1d4ed8', icon: Calendar }
  }
  if (t.includes('application') || t.includes('candidate') || t.includes('job')) {
    return { label: typeStr || 'Application', bg: '#f0fdf4', color: '#15803d', icon: CheckCircle2 }
  }
  if (t.includes('warn') || t.includes('alert') || t.includes('urgent')) {
    return { label: typeStr || 'Alert', bg: '#fef2f2', color: '#b91c1c', icon: AlertCircle }
  }
  return { label: typeStr || 'Notification', bg: '#f5f3ff', color: '#6d28d9', icon: Info }
}

export default function Notifications() {
  const nav = useNavigate()

  // Filter & Search states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all')
  const [preset, setPreset] = useState('all') // 'all', 'today', '7days', '30days', 'thisMonth'
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  // Data state
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [clearMode, setClearMode] = useState('read') // 'read' or 'all'
  const [actionLoading, setActionLoading] = useState(false)

  // Load data function
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      if (search.trim()) params.set('q', search.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      params.set('page', page)
      params.set('per_page', perPage)

      const res = await apiGet(`/notifications?${params.toString()}`)
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, search, statusFilter, typeFilter, page, perPage])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Date Preset handlers
  const applyPreset = (presetKey) => {
    setPreset(presetKey)
    setPage(1)
    const today = new Date()

    if (presetKey === 'all') {
      setStartDate('')
      setEndDate('')
      return
    }

    const formatYMD = (d) => d.toISOString().split('T')[0]

    if (presetKey === 'today') {
      const ymd = formatYMD(today)
      setStartDate(ymd)
      setEndDate(ymd)
    } else if (presetKey === '7days') {
      const start = new Date()
      start.setDate(today.getDate() - 6)
      setStartDate(formatYMD(start))
      setEndDate(formatYMD(today))
    } else if (presetKey === '30days') {
      const start = new Date()
      start.setDate(today.getDate() - 29)
      setStartDate(formatYMD(start))
      setEndDate(formatYMD(today))
    } else if (presetKey === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(formatYMD(start))
      setEndDate(formatYMD(today))
    }
  }

  const handleCustomDateChange = (type, val) => {
    setPreset('custom')
    setPage(1)
    if (type === 'start') setStartDate(val)
    if (type === 'end') setEndDate(val)
  }

  const resetAllFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setPreset('all')
    setPage(1)
  }

  // Item Action Handlers
  const markAllRead = async () => {
    try {
      setActionLoading(true)
      await apiPut('/notifications/read-all')
      await fetchNotifications()
    } catch (err) {
      alert('Error marking all as read: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleReadStatus = async (n, e) => {
    e.stopPropagation()
    try {
      if (n.is_read) {
        await apiPut(`/notifications/${n.id}/unread`)
      } else {
        await apiPut(`/notifications/${n.id}/read`)
      }
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteSingle = async (n, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this notification permanently from history?')) return
    try {
      await apiDelete(`/notifications/${n.id}`)
      fetchNotifications()
    } catch (err) {
      alert('Failed to delete notification: ' + err.message)
    }
  }

  const handleClearHistory = async () => {
    try {
      setActionLoading(true)
      await apiDelete(`/notifications/clear?filter=${clearMode}`)
      setConfirmClearOpen(false)
      fetchNotifications()
    } catch (err) {
      alert('Failed to clear notifications: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const openNotification = async (n) => {
    if (!n.is_read) {
      try {
        await apiPut(`/notifications/${n.id}/read`)
      } catch (err) {
        console.error(err)
      }
    }
    if (n.link) nav(n.link)
    else fetchNotifications()
  }

  // Export History to CSV
  const exportHistoryCSV = () => {
    if (!data?.items || data.items.length === 0) return
    const headers = ['ID', 'Title', 'Message', 'Type', 'Status', 'Date Time', 'Link']
    const rows = data.items.map((n) => [
      n.id,
      `"${(n.title || '').replace(/"/g, '""')}"`,
      `"${(n.message || '').replace(/"/g, '""')}"`,
      n.type || 'info',
      n.is_read ? 'Read' : 'Unread',
      fmtDateTime(n.created_at),
      n.link || ''
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `notification_history_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Group notifications by Date Header
  const groupedNotifications = useMemo(() => {
    if (!data?.items) return []
    const groups = {}
    data.items.forEach((item) => {
      const headerKey = formatDateHeader(item.created_at)
      if (!groups[headerKey]) groups[headerKey] = []
      groups[headerKey].push(item)
    })
    return Object.entries(groups)
  }, [data])

  const items = data?.items || []
  const unreadCount = data?.unread || 0
  const totalCount = data?.total || 0
  const totalPages = data?.pages || 1
  const availableTypes = data?.types || []

  const hasActiveFilters = startDate || endDate || search || statusFilter !== 'all' || typeFilter !== 'all'

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <PageHeader
        title="Notification History"
        subtitle="Full historical log of all system notifications, alerts, and updates."
        icon={Bell}
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {unreadCount > 0 && (
              <button className="btn-soft" onClick={markAllRead} disabled={actionLoading}>
                <CheckCheck size={16} style={{ marginRight: 6 }} /> Mark all read
              </button>
            )}
            <button className="btn-secondary" onClick={exportHistoryCSV} disabled={items.length === 0}>
              <Download size={16} style={{ marginRight: 6 }} /> Export CSV
            </button>
            <button className="btn-secondary" onClick={() => setConfirmClearOpen(true)} disabled={totalCount === 0}>
              <Trash2 size={16} style={{ marginRight: 6, color: '#ef4444' }} /> Clear History
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Bell size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 500 }}>Total Recorded</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{totalCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: unreadCount > 0 ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: unreadCount > 0 ? '#dc2626' : '#16a34a' }}>
            <Mail size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 500 }}>Unread Messages</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: unreadCount > 0 ? '#dc2626' : 'var(--text)', marginTop: 2 }}>{unreadCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 500 }}>Date Filter Mode</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
              {startDate || endDate ? `${startDate || 'Start'} to ${endDate || 'Now'}` : 'All Historical Logs'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Search & Status Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search size={17} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                type="text"
                placeholder="Search notification history by keyword..."
                className="input"
                style={{ paddingLeft: 38, width: '100%' }}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '4px', borderRadius: 8, gap: '4px' }}>
              {[
                { key: 'all', label: 'All Status' },
                { key: 'unread', label: `Unread (${unreadCount})` },
                { key: 'read', label: 'Read' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setStatusFilter(tab.key); setPage(1) }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: statusFilter === tab.key ? 600 : 500,
                    background: statusFilter === tab.key ? '#ffffff' : 'transparent',
                    color: statusFilter === tab.key ? 'var(--brand-700)' : 'var(--text-2)',
                    boxShadow: statusFilter === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Date Search & Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> Date Search:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="date"
                  className="input"
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                  value={startDate}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>to</span>
                <input
                  type="date"
                  className="input"
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                  value={endDate}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                />
              </div>
            </div>

            {/* Quick Date Presets */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: '7days', label: 'Last 7 Days' },
                { key: '30days', label: 'Last 30 Days' },
                { key: 'thisMonth', label: 'This Month' }
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid ' + (preset === p.key ? 'var(--brand-600)' : 'var(--border)'),
                    fontSize: '12px',
                    fontWeight: preset === p.key ? 600 : 500,
                    background: preset === p.key ? 'var(--brand-50)' : '#ffffff',
                    color: preset === p.key ? 'var(--brand-700)' : 'var(--text-2)',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            {availableTypes.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <Filter size={14} style={{ color: 'var(--text-3)' }} />
                <select
                  className="input"
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                >
                  <option value="all">All Notification Types</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                className="btn-soft"
                onClick={resetAllFilters}
                style={{ padding: '5px 10px', fontSize: '12px', color: '#ef4444' }}
              >
                <RotateCcw size={13} style={{ marginRight: 4 }} /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Notification History Timeline View */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notification history found"
          message={hasActiveFilters ? 'No notifications match your current search and date filters.' : 'You have no historical notifications yet.'}
          action={hasActiveFilters && <button className="btn-secondary" onClick={resetAllFilters}>Clear Filters</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groupedNotifications.map(([dateGroupHeader, notifList]) => (
            <div key={dateGroupHeader} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Date Group Header */}
              <div
                style={{
                  padding: '12px 20px',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  color: 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Calendar size={15} style={{ color: 'var(--brand-600)' }} />
                {dateGroupHeader}
                <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)' }}>
                  {notifList.length} {notifList.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items in date group */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifList.map((n) => {
                  const badge = getTypeBadgeProps(n.type)
                  const TypeIcon = badge.icon

                  return (
                    <div
                      key={n.id}
                      onClick={() => openNotification(n)}
                      style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: n.is_read ? '#ffffff' : 'rgba(238, 242, 255, 0.5)',
                        transition: 'background 0.2s ease',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Unread dot / Type Icon */}
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: badge.bg,
                          color: badge.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                          position: 'relative'
                        }}
                      >
                        <TypeIcon size={18} />
                        {!n.is_read && (
                          <span
                            style={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: '#ef4444',
                              border: '2px solid #ffffff'
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontWeight: n.is_read ? 600 : 700,
                                fontSize: '15px',
                                color: n.is_read ? 'var(--text)' : 'var(--brand-800)'
                              }}
                            >
                              {n.title}
                            </span>
                            {n.type && (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: badge.bg,
                                  color: badge.color,
                                  textTransform: 'capitalize'
                                }}
                              >
                                {badge.label}
                              </span>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} /> {fmtDateTime(n.created_at)}
                          </div>
                        </div>

                        <div style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: 6, lineHeight: 1.55 }}>
                          {n.message}
                        </div>

                        {/* Footer Action Buttons */}
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                          {n.link && (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-600)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              View Details <ExternalLink size={13} />
                            </span>
                          )}

                          <button
                            onClick={(e) => toggleReadStatus(n, e)}
                            title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'var(--text-3)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            {n.is_read ? <MailRead size={14} /> : <Mail size={14} />}
                            {n.is_read ? 'Mark Unread' : 'Mark Read'}
                          </button>

                          <button
                            onClick={(e) => deleteSingle(n, e)}
                            title="Delete notification"
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#94a3b8',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              marginLeft: 'auto'
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Pagination Bar */}
          <div
            className="card"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              Showing {items.length} of {totalCount} notifications (Page {page} of {totalPages})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
                <span>Per page:</span>
                <select
                  className="input"
                  style={{ padding: '4px 8px', fontSize: '13px' }}
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  className="btn-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing History */}
      {confirmClearOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div className="card" style={{ maxWidth: 450, width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={20} style={{ color: '#ef4444' }} /> Clear Notification History
              </h3>
              <button onClick={() => setConfirmClearOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 20 }}>
              Select which notifications you want to clear permanently from your history log.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="clearMode"
                  value="read"
                  checked={clearMode === 'read'}
                  onChange={() => setClearMode('read')}
                />
                Clear only read notifications
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="clearMode"
                  value="all"
                  checked={clearMode === 'all'}
                  onChange={() => setClearMode('all')}
                />
                Clear ALL notification history (unread & read)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setConfirmClearOpen(false)}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#ffffff' }}
                onClick={handleClearHistory}
                disabled={actionLoading}
              >
                {actionLoading ? 'Clearing...' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

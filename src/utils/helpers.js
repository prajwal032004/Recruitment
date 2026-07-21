// Initials from a name, e.g. "Priya Mehta" -> "PM"
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

// Deterministic avatar color from a string.
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#a855f7',
]
export function avatarColor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// Map an arbitrary status string to a badge variant class.
export function statusBadgeClass(status = '') {
  const s = String(status).toLowerCase()
  if (['active', 'completed', 'approved', 'hired', 'placed', 'selected', 'open'].some((k) => s.includes(k))) return 'badge-green'
  if (['processing', 'in progress', 'in-progress', 'pending', 'review', 'interview', 'on hold', 'draft', 'not started', 'enrolled'].some((k) => s.includes(k))) return 'badge-amber'
  if (['failed', 'inactive', 'rejected', 'closed', 'critical', 'overdue'].some((k) => s.includes(k))) return 'badge-red'
  if (['applied', 'screening', 'shortlisted', 'scheduled'].some((k) => s.includes(k))) return 'badge-blue'
  return 'badge-gray'
}

// Severity band -> badge variant.
export function severityBadgeClass(sev = '') {
  const s = String(sev).toLowerCase()
  if (s.includes('critical')) return 'badge-red'
  if (s.includes('high')) return 'badge-amber'
  if (s.includes('medium')) return 'badge-blue'
  if (s.includes('low')) return 'badge-violet'
  return 'badge-green'
}

export function fmtNumber(n) {
  if (n === null || n === undefined || n === '') return '—'
  const num = Number(n)
  if (Number.isNaN(num)) return String(n)
  return num.toLocaleString('en-US')
}

export function fmtDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return String(str)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function pct(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '0%'
  return `${Math.round(Number(n))}%`
}

export function fmtKb(kb) {
  if (!kb && kb !== 0) return '—'
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${Math.round(kb)} KB`
}

export const LEVEL_LABELS = ['Not Assessed', 'Basic', 'Intermediate', 'Proficient', 'Expert']
export function levelLabel(n) {
  return LEVEL_LABELS[Number(n)] ?? '—'
}

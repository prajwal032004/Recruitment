import { Loader2, Inbox, AlertTriangle, X } from 'lucide-react'
import { initials, avatarColor } from '../utils/helpers'

/* ---------- Loading ---------- */
export function LoadingSpinner({ label = 'Loading…', full }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: full ? '80px 20px' : '48px 20px', color: 'var(--text-3)',
    }}>
      <Loader2 className="spin" size={26} style={{ color: 'var(--brand-500)' }} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  )
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '52px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center',
        background: 'var(--brand-50)', color: 'var(--brand-500)', marginBottom: 4,
      }}><Icon size={24} /></div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      {message && <div className="muted" style={{ fontSize: 13, maxWidth: 380 }}>{message}</div>}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  )
}

/* ---------- Error state ---------- */
export function ErrorState({ message = 'Could not load this data.', onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '48px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center',
        background: 'var(--red-50)', color: 'var(--red-500)',
      }}><AlertTriangle size={24} /></div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>Something went wrong</div>
      <div className="muted" style={{ fontSize: 13, maxWidth: 420 }}>{message}</div>
      {onRetry && <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={onRetry}>Try again</button>}
    </div>
  )
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 36 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: avatarColor(name || ''), fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  )
}

/* ---------- Status / severity badge ---------- */
export function Badge({ children, variant = 'badge-gray', dot }) {
  return <span className={`badge ${variant}`}>{dot && <span className="dot" />}{children}</span>
}

/* ---------- Progress bar ---------- */
export function ProgressBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return <div className="progress"><span style={{ width: `${v}%` }} /></div>
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, width = 520 }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,22,40,.42)', backdropFilter: 'blur(2px)',
      zIndex: 900, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px 16px',
      overflowY: 'auto',
    }}>
      <div className="fade-in" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: 16, boxShadow: 'var(--shadow-lg)',
        width: '100%', maxWidth: width,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-3)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Page header ---------- */
export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
        {Icon && (
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--brand-gradient)', display: 'grid', placeItems: 'center', color: '#fff', flex: 'none', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}>
            <Icon size={21} />
          </div>
        )}
        <div>
          <h1 className="h1">{title}</h1>
          {subtitle && <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

/* ---------- Stat card ---------- */
export function StatCard({ icon: Icon, label, value, sub, tone = 'brand', trend }) {
  const tones = {
    brand:  ['var(--brand-50)', 'var(--brand-600)'],
    green:  ['var(--green-50)', 'var(--green-700)'],
    amber:  ['var(--amber-50)', 'var(--amber-700)'],
    red:    ['var(--red-50)', 'var(--red-700)'],
    blue:   ['var(--blue-50)', 'var(--blue-700)'],
    violet: ['var(--violet-50)', 'var(--violet-700)'],
  }
  const [bg, fg] = tones[tone] || tones.brand
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="eyebrow">{label}</span>
        {Icon && <span style={{ width: 34, height: 34, borderRadius: 10, background: bg, color: fg, display: 'grid', placeItems: 'center' }}><Icon size={17} /></span>}
      </div>
      <div>
        <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
        {sub && <div className="muted" style={{ fontSize: 12.5, marginTop: 7 }}>{sub}</div>}
        {trend && <div style={{ fontSize: 12, marginTop: 7, color: fg, fontWeight: 600 }}>{trend}</div>}
      </div>
    </div>
  )
}

/* ---------- Pagination ---------- */
export function Pagination({ page, perPage, total, onPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (perPage || 1)))
  if (pages <= 1) return null
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderTop: '1px solid var(--border)', fontSize: 13 }}>
      <span className="muted">Showing {from}–{to} of {total}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span style={{ display: 'grid', placeItems: 'center', padding: '0 10px', fontWeight: 600 }}>{page} / {pages}</span>
        <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}

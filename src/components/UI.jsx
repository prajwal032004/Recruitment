import { useState } from 'react'
import { Loader2, Inbox, AlertTriangle, X } from 'lucide-react'
import { initials, avatarColor } from '../utils/helpers'
import { baseURL } from '../api/client'

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
export function Avatar({ name, src, profile_image, image, size = 36, style = {} }) {
  const [imgErr, setImgErr] = useState(false)
  const rawSrc = src || profile_image || image
  let fullSrc = null

  if (rawSrc && !imgErr) {
    if (rawSrc.startsWith('http://') || rawSrc.startsWith('https://') || rawSrc.startsWith('data:')) {
      fullSrc = rawSrc
    } else {
      fullSrc = `${baseURL}/files/${rawSrc.replace(/^\/+/, '')}`
    }
  }

  if (fullSrc) {
    return (
      <img
        src={fullSrc}
        alt={name || 'Avatar'}
        onError={() => setImgErr(true)}
        className="avatar"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
          ...style
        }}
      />
    )
  }

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: avatarColor(name || ''),
        fontSize: size * 0.36,
        display: 'inline-grid',
        placeItems: 'center',
        borderRadius: '50%',
        color: '#ffffff',
        fontWeight: 700,
        flexShrink: 0,
        ...style
      }}
    >
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
export function Modal({ open, isOpen, onClose, title, children, footer, width = 520 }) {
  const show = open !== undefined ? open : (isOpen !== undefined ? isOpen : true)
  if (!show) return null
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
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {Icon && (
          <div style={{
            width: 46, height: 46, borderRadius: 14, background: 'var(--brand-gradient)',
            display: 'grid', placeItems: 'center', color: '#fff', flex: 'none',
            boxShadow: '0 8px 20px rgba(197, 48, 123, 0.25)'
          }}>
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="h1" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
          {subtitle && <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</div>}
    </div>
  )
}

/* ---------- Stat card ---------- */
export function StatCard({ icon: Icon, label, value, sub, tone = 'brand', trend }) {
  const tones = {
    brand:  ['#fdf2f8', '#c5307b', '#fbcfe8'],
    green:  ['#ecfdf5', '#059669', '#a7f3d0'],
    amber:  ['#fffbeb', '#d97706', '#fde68a'],
    red:    ['#fef2f2', '#dc2626', '#fecaca'],
    blue:   ['#eff6ff', '#2563eb', '#bfdbfe'],
    violet: ['#f5f3ff', '#7c3aed', '#ddd6fe'],
  }
  const [bg, fg, border] = tones[tone] || tones.brand
  return (
    <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="eyebrow" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-3)' }}>{label}</span>
        {Icon && (
          <span style={{
            width: 38, height: 38, borderRadius: 11, background: bg, color: fg,
            display: 'grid', placeItems: 'center', border: `1px solid ${border}`
          }}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12.5, marginTop: 8, color: 'var(--text-2)', fontWeight: 500 }}>{sub}</div>}
        {trend && <div style={{ fontSize: 12, marginTop: 8, color: fg, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>{trend}</div>}
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

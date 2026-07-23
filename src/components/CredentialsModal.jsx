import { useState } from 'react'
import { KeyRound, Copy, Check, ShieldCheck, Mail, X } from 'lucide-react'
import { Modal, Avatar } from './UI'

export function CredentialsModal({ open, onClose, credentials }) {
  const [copied, setCopied] = useState(false)
  const [showPw, setShowPw] = useState(false)

  if (!open || !credentials) return null

  const { name, employee_code, username, password } = credentials
  const empSlug = employee_code || username
  const portalUrl = `${window.location.origin}/emp/${empSlug}`

  const copyText = `MPC Cloud Consulting — Personalized Employee Credentials
Name: ${name}
Employee Code: ${employee_code || 'N/A'}
Personal Portal Link: ${portalUrl}
Temporary Password: ${password}

Note: Your username is pre-filled on your personal link. Simply enter your password to access your dashboard!`

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Employee Account Created"
      width={480}
      footer={
        <button className="btn-ghost btn-sm" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="stack" style={{ gap: 20 }}>
        {/* Banner */}
        <div
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
            borderRadius: 12,
            border: '1px solid #fbcfe8',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--brand-gradient)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              Credentials Generated
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Share these login details directly with the employee.
            </div>
          </div>
        </div>

        {/* User Badge */}
        <div
          className="flex"
          style={{
            gap: 12,
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--surface-2)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          <Avatar name={name} size={42} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{name}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              Code: <strong style={{ color: 'var(--brand-600)' }}>{employee_code || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Credentials Details Box */}
        <div
          style={{
            padding: 16,
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: 12,
            fontFamily: 'monospace',
            fontSize: 13,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal Portal URL
            </span>
            <strong style={{ color: '#a7f3d0' }}>{portalUrl}</strong>
          </div>
          <div style={{ height: 1, background: '#334155' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username / Email
            </span>
            <strong style={{ color: '#38bdf8' }}>{username}</strong>
          </div>
          <div style={{ height: 1, background: '#334155' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Temporary Password
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ color: '#f472b6' }}>{showPw ? password : '••••••••••••'}</strong>
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  background: '#1e293b',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>

        {/* Copy & Share Actions */}
        <div className="flex" style={{ gap: 10 }}>
          <button
            className="btn-primary btn-block flex"
            style={{ gap: 8, justifyContent: 'center' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Credentials Copied!' : 'Copy Credentials to Share'}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

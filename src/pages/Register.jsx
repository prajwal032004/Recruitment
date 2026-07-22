import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await register(form)
      toast.success('Account created successfully')
      nav('/app/my-applications')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="mpc-auth-wrap">
      <div className="mpc-auth-left" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80)' }}>
        <div className="mpc-auth-overlay" style={{ background: 'rgba(38, 38, 38, 0.85)' }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>YOUR CAREER<br/>STARTS HERE</h1>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Join the hub for the most dynamic and passionate individuals.</p>
          </div>
        </div>
      </div>
      <div className="mpc-auth-right fade-in">
        <div className="mpc-auth-card">
          <Link to="/" className="mpc-logo" style={{ marginBottom: 40 }}>
            <span className="mpc-logo-text">MPC</span>
            <span className="mpc-logo-sub">CLOUD CONSULTING</span>
          </Link>
          
          <h2 className="mpc-auth-title">Create account</h2>
          <p className="mpc-auth-sub">Apply and track your job applications easily.</p>

          <form onSubmit={submit} className="stack" style={{ gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Full name *</label>
              <input className="mpc-input" value={form.name} required onChange={set('name')} placeholder="e.g. Jane Doe" />
            </div>
            <div>
              <label style={{ display: 'block', color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Email address *</label>
              <input className="mpc-input" type="email" value={form.email} required onChange={set('email')} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Phone (optional)</label>
              <input className="mpc-input" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label style={{ display: 'block', color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Password *</label>
              <input className="mpc-input" type="password" value={form.password} required minLength={6}
                onChange={set('password')} placeholder="At least 6 characters" />
            </div>
            
            <button className="mpc-btn" disabled={busy} style={{ marginTop: 8 }}>
              {busy ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
            </button>
          </form>
          
          <div className="divider" style={{ margin: '32px 0' }} />
          
          <p className="muted" style={{ textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
            Already have an account? <Link style={{ color: '#c5307b', fontWeight: 700 }} to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

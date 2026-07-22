import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name}`)
      if (user.role === 'CANDIDATE') nav('/app/my-applications')
      else if (user.role === 'HR') nav('/app/pipeline')
      else nav('/app/dashboard')
    } catch (err) {
      toast.error(err.message || 'Sign in failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="mpc-auth-wrap">
      <div className="mpc-auth-left">
        <div className="mpc-auth-overlay">
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16 }}>JOIN THE<br/>REVOLUTION</h1>
            <p style={{ fontSize: 16, fontWeight: 600 }}>MPC Cloud Consulting — Shape the future of Enterprise Tech.</p>
          </div>
        </div>
      </div>
      <div className="mpc-auth-right fade-in">
        <div className="mpc-auth-card">
          <Link to="/careers" className="mpc-logo" style={{ marginBottom: 40 }}>
            <span className="mpc-logo-text">MPC</span>
            <span className="mpc-logo-sub">CLOUD CONSULTING</span>
          </Link>
          
          <h2 className="mpc-auth-title">Welcome back</h2>
          <p className="mpc-auth-sub">Sign in to your account to continue</p>

          <form onSubmit={submit} className="stack" style={{ gap: 20 }}>
            <div>
              <label style={{ display: 'block', color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Email address</label>
              <input className="mpc-input" type="email" value={email} required
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Password</label>
              <input className="mpc-input" type="password" value={password} required
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            
            <button className="mpc-btn" disabled={busy} style={{ marginTop: 8 }}>
              {busy ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
          </form>

          <div className="divider" style={{ margin: '32px 0' }} />
          
          <div className="flex wrap" style={{ gap: 8, justifyContent: 'center', marginBottom: 32 }}>
            <span className="eyebrow" style={{ width: '100%', textAlign: 'center' }}>Demo Accounts</span>
            <button type="button" className="mpc-btn-outline" onClick={() => { setEmail('admin@recruit.local'); setPassword('admin12345') }}>
              Admin
            </button>
          </div>

          <p className="muted" style={{ textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
            New candidate? <Link style={{ color: '#c5307b', fontWeight: 700 }} to="/register">Create an account</Link>
          </p>
          <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: 13, fontWeight: 500 }}>
            <Link style={{ color: '#555', textDecoration: 'underline' }} to="/careers">Browse open jobs →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

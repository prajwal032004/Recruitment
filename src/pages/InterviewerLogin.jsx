import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function InterviewerLogin() {
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
      toast.success(`Welcome, ${user.name}`)
      if (user.role === 'INTERVIEWER') {
        nav('/app/my-interviews')
      } else if (user.role === 'HR') {
        nav('/app/pipeline')
      } else {
        nav('/app/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Sign in failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          <div>
            <div className="brand-name" style={{ fontSize: 17 }}>Interviewer Portal Login</div>
            <div className="brand-sub">MPC Cloud Consulting</div>
          </div>
        </div>
        <p className="muted mb-4">Sign in to view your assigned candidate interviews and submit evaluation feedback.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Interviewer Email</label>
            <input className="input" type="email" value={email} required placeholder="interviewer@company.com" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} required placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary btn-block" disabled={busy} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
            <LogIn size={17} /> {busy ? 'Signing in…' : 'Sign in to Interviewer Portal'}
          </button>
        </form>
        <p className="muted mt-4" style={{ textAlign: 'center', fontSize: 13 }}>
          This portal is reserved for interviewers. Contact your HR administrator for access.
        </p>
      </div>
    </div>
  )
}

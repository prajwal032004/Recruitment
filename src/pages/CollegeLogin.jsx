import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function CollegeLogin() {
  const { slug } = useParams()
  const { collegeLogin } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const data = await collegeLogin(slug, email, password)
      toast.success(`Welcome, ${data.user.name}`)
      nav(`/${slug}`)
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
            <div className="brand-name" style={{ fontSize: 17 }}>Placement Officer Login</div>
            <div className="brand-sub">{slug}</div>
          </div>
        </div>
        <p className="muted mb-4">Sign in to manage your college's placement drives.</p>
        <form onSubmit={submit}>
          <div className="field"><label>Email</label>
            <input className="input" type="email" value={email} required onChange={(e) => setEmail(e.target.value)} placeholder="officer@college.edu" /></div>
          <div className="field"><label>Password</label>
            <input className="input" type="password" value={password} required onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <button className="btn-primary btn-block" disabled={busy}>
            <LogIn size={17} /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 flex wrap" style={{ gap: 8, justifyContent: 'center' }}>
          <button type="button" className="btn-soft btn-sm" onClick={() => { setEmail('sharan@gmail.com'); setPassword('123456') }}>
            Demo Fill (sharan@gmail.com)
          </button>
        </div>

        <p className="muted mt-4" style={{ textAlign: 'center', fontSize: 13 }}>
          This portal is exclusive to your college. Contact platform admin for access.<br/>
          <a href="/login" style={{ color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: 8 }}>← Standard Login</a>
        </p>
      </div>
    </div>
  )
}

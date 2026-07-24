import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Building2, Briefcase } from 'lucide-react'
import { apiGet, apiPost } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner, ErrorState, Avatar, Badge } from '../components/UI'
import { useToast } from '../contexts/ToastContext'

export default function EmployeePortalLogin() {
  const { empCode } = useParams()
  const navigate = useNavigate()
  const { loginWithSession } = useAuth()
  const toast = useToast()

  const [empInfo, setEmpInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function loadPortal() {
      setLoading(true)
      setError(null)
      try {
        const res = await apiGet(`/auth/emp/${empCode}`)
        if (active) setEmpInfo(res)
      } catch (e) {
        if (active) setError(e.message || 'Employee portal link not found.')
      } finally {
        if (active) setLoading(false)
      }
    }
    if (empCode) loadPortal()
    return () => { active = false }
  }, [empCode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return toast.error('Please enter your password.')
    setBusy(true)
    try {
      const res = await apiPost(`/auth/emp/${empCode}/login`, { password })
      loginWithSession(res.token, res.user)
      toast.success(`Welcome back, ${res.user.name || empInfo?.name}!`)
      navigate('/app/my-profile')
    } catch (e) {
      toast.error(e.message || 'Invalid password.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner full label="Loading your employee portal..." />

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--surface-2)', padding: 24 }}>
        <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: 32 }}>
          <ErrorState message={error} />
          <Link to="/login" className="btn-primary mt-4" style={{ display: 'inline-block' }}>
            Go to Main Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: 20 }}>
      <div
        className="card fade-in"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: '36px 32px',
          borderRadius: 20,
          background: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-block', marginBottom: 16 }}>
            <Avatar name={empInfo.name} src={empInfo.profile_image} size={76} style={{ fontSize: 28, boxShadow: '0 8px 24px rgba(197, 48, 123, 0.25)', border: '3px solid #fbcfe8' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Welcome, {empInfo.name}
          </h1>
          <div className="flex" style={{ gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <Badge variant="badge-violet" style={{ fontSize: 12 }}>Code: {empInfo.employee_code}</Badge>
            {empInfo.department && (
              <Badge variant="badge-blue" style={{ fontSize: 12 }}>{empInfo.department}</Badge>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--surface-2)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            fontSize: 12.5,
            color: 'var(--text-2)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ShieldCheck size={18} color="var(--brand-600)" style={{ flexShrink: 0 }} />
          <div>
            Signing in as <strong>{empInfo.email}</strong>. Enter your password to access your dashboard.
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="stack" style={{ gap: 20 }}>
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="input"
                style={{ paddingRight: 40, width: '100%', fontSize: 14, height: 44, borderRadius: 10 }}
                placeholder="Enter your employee password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: 12, background: 'none', border: 'none',
                  color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block flex"
            style={{
              justify: 'center',
              gap: 8,
              height: 46,
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              boxShadow: '0 8px 20px rgba(197, 48, 123, 0.3)',
            }}
            disabled={busy}
          >
            <span>{busy ? 'Signing In...' : 'Sign In to Employee Portal'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <Link to="/login" style={{ fontSize: 12.5, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600 }}>
            Not {empInfo.name}? Go to standard login
          </Link>
        </div>
      </div>
    </div>
  )
}

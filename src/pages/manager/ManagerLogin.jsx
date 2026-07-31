import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Building2, ShieldCheck, LogIn, Lock, Mail, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { apiGet, apiPost } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner } from '../../components/UI'

export default function ManagerLogin() {
  const { deptSlug } = useParams()
  const slug = (deptSlug || 'engineering').toLowerCase()
  const navigate = useNavigate()
  const { loginWithSession } = useAuth()
  const toast = useToast()

  const [deptInfo, setDeptInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const DEMO_MANAGERS = [
    { name: 'Engineering', slug: 'engineering', email: 'manager.engineering@mpc.com', mgrName: 'Sarah Connor' },
    { name: 'Finance', slug: 'finance', email: 'manager.finance@mpc.com', mgrName: 'David Miller' },
    { name: 'Marketing', slug: 'marketing', email: 'manager.marketing@mpc.com', mgrName: 'Elena Rostova' },
    { name: 'Sales', slug: 'sales', email: 'manager.sales@mpc.com', mgrName: 'Robert Vance' },
    { name: 'Human Resources', slug: 'hr', email: 'manager.hr@mpc.com', mgrName: 'Amanda Waller' },
  ]

  useEffect(() => {
    let active = true
    async function loadDept() {
      setLoading(true)
      try {
        const res = await apiGet(`/manager/dept/${slug}`)
        if (active) {
          setDeptInfo(res.department)
          if (res.manager_email) setEmail(res.manager_email)
        }
      } catch (err) {
        if (active) {
          setDeptInfo({ name: slug.toUpperCase(), slug })
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadDept()
    return () => { active = false }
  }, [slug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please enter email and password.')
    setBusy(true)
    try {
      const res = await apiPost(`/manager/dept/${slug}/login`, { email, password })
      loginWithSession(res.token, res.user)
      toast.success(`Welcome to ${res.user.department_name || deptInfo?.name || 'Department'} Manager Portal!`)
      navigate(`/manager/${slug}`)
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify credentials.')
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = (item) => {
    navigate(`/manager/${item.slug}/login`)
    setEmail(item.email)
    setPassword('123456')
  }

  if (loading) return <LoadingSpinner full label="Loading Department Manager Portal..." />

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        
        {/* Main Card */}
        <div
          className="card fade-in"
          style={{
            padding: '36px 32px',
            borderRadius: 20,
            background: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Company Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link to="/" style={{ display: 'inline-block', marginBottom: 12 }}>
              <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: 48, objectFit: 'contain' }} />
            </Link>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, color: '#166534', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
              <Building2 size={14} />
              <span>{deptInfo?.name || slug.toUpperCase()} DEPARTMENT PORTAL</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 4px 0', color: '#0f172a' }}>
              Department Manager Sign In
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Role-based portal for requisition management & candidate pipeline control
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="stack" style={{ gap: 18 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Manager Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input"
                  style={{ paddingLeft: 38, height: 44, borderRadius: 10, fontSize: 14, width: '100%' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`manager.${slug}@mpc.com`}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
              </div>
            </div>

            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input"
                  style={{ paddingLeft: 38, height: 44, borderRadius: 10, fontSize: 14, width: '100%' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary btn-block flex"
              disabled={busy}
              style={{
                justifyContent: 'center',
                gap: 8,
                height: 46,
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
              }}
            >
              <LogIn size={18} />
              <span>{busy ? 'Verifying Department Access...' : `Sign In to ${deptInfo?.name || 'Department'} Portal`}</span>
            </button>
          </form>

          {/* Security Note */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Authorized Department Managers only. Use the credentials provided by HR Administration.
            </span>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 12.5, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
              ← Return to Main Admin / HR Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

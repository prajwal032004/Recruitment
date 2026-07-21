import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div className="card" style={{ padding: '40px 36px', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 56, height: 56, borderRadius: 15, background: 'var(--amber-50)', color: 'var(--amber-700)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <ShieldAlert size={27} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Access restricted</h1>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
          Your role does not have permission to view this page. Contact an administrator if you believe this is a mistake.
        </p>
        <Link to="/app" className="btn btn-primary" style={{ marginTop: 20 }}>Back to my workspace</Link>
      </div>
    </div>
  )
}

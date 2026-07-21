import { useNavigate } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  const nav = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1035 40%, #0f0f1a 100%)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Animated stars */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} style={{
            position: 'absolute',
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: '#fff',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.3,
            animation: `notfound-twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>

      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 1,
        padding: '40px 24px', maxWidth: 520,
      }}>
        {/* Floating astronaut */}
        <div style={{
          fontSize: 80, lineHeight: 1, marginBottom: 16,
          animation: 'notfound-float 4s ease-in-out infinite',
        }}>
          🧑‍🚀
        </div>

        {/* 404 */}
        <div style={{
          fontSize: 120, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #6366f1, #ec4899, #f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 12,
        }}>
          404
        </div>

        <h2 style={{
          fontSize: 24, fontWeight: 700, color: '#e2e8f0',
          marginBottom: 8,
        }}>
          Lost in Space
        </h2>

        <p style={{
          fontSize: 15, color: '#94a3b8', lineHeight: 1.7,
          marginBottom: 32, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto',
        }}>
          The page you're looking for doesn't exist or has been moved.
          Don't worry — even astronauts take wrong turns.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => nav('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,.4)',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 28px rgba(99,102,241,.5)' }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(99,102,241,.4)' }}
          >
            <Home size={16} /> Go Home
          </button>
          <button
            onClick={() => nav(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12,
              background: 'rgba(255,255,255,.08)',
              color: '#e2e8f0', fontWeight: 600, fontSize: 14,
              border: '1px solid rgba(255,255,255,.15)', cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'background .2s',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,.14)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,.08)' }}
          >
            <Search size={16} /> Go Back
          </button>
        </div>
      </div>

      <style>{`
        @keyframes notfound-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(5deg); }
        }
        @keyframes notfound-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}

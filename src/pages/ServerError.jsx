import { useNavigate } from 'react-router-dom'
import { Home, RefreshCw } from 'lucide-react'

export default function ServerError() {
  const nav = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #1a0a0a 0%, #2d1020 40%, #1a0a0a 100%)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Circuit lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            background: '#ec4899',
            borderRadius: 2,
            ...(i % 2 === 0
              ? { width: `${30 + Math.random() * 40}%`, height: 2, top: `${10 + i * 7}%`, left: `${Math.random() * 30}%` }
              : { height: `${20 + Math.random() * 30}%`, width: 2, left: `${10 + i * 8}%`, top: `${Math.random() * 40}%` }
            ),
            animation: `servererr-pulse ${2 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }} />
        ))}
      </div>

      <div style={{
        textAlign: 'center', position: 'relative', zIndex: 1,
        padding: '40px 24px', maxWidth: 520,
      }}>
        {/* Broken gear */}
        <div style={{
          fontSize: 72, lineHeight: 1, marginBottom: 16,
          animation: 'servererr-shake 0.8s ease-in-out infinite',
        }}>
          ⚙️
        </div>

        {/* 500 */}
        <div style={{
          fontSize: 110, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, #ef4444, #ec4899, #f97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 12,
          animation: 'servererr-glitch 3s ease-in-out infinite',
        }}>
          500
        </div>

        <h2 style={{
          fontSize: 24, fontWeight: 700, color: '#fecdd3',
          marginBottom: 8,
        }}>
          Server Error
        </h2>

        <p style={{
          fontSize: 15, color: '#d4a0aa', lineHeight: 1.7,
          marginBottom: 32, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
        }}>
          Something went wrong on our end. Our team has been notified.
          Please try again in a moment.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #ef4444, #ec4899)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(239,68,68,.4)',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 28px rgba(239,68,68,.5)' }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(239,68,68,.4)' }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
          <button
            onClick={() => nav('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12,
              background: 'rgba(255,255,255,.08)',
              color: '#fecdd3', fontWeight: 600, fontSize: 14,
              border: '1px solid rgba(255,255,255,.15)', cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'background .2s',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,.14)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,.08)' }}
          >
            <Home size={16} /> Go Home
          </button>
        </div>
      </div>

      <style>{`
        @keyframes servererr-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }
        @keyframes servererr-glitch {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-3px, 1px); }
          94% { transform: translate(3px, -1px); }
          96% { transform: translate(-1px, 2px); }
          98% { transform: translate(2px, -2px); }
        }
        @keyframes servererr-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

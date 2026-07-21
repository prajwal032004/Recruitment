import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

let idc = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((message, type = 'info') => {
    const id = ++idc
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => remove(id), 4200)
  }, [remove])

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }

  const icon = { success: CheckCircle2, error: AlertCircle, info: Info }
  const color = { success: 'var(--green-500)', error: 'var(--red-500)', info: 'var(--brand-600)' }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
        {toasts.map((t) => {
          const Icon = icon[t.type] || Info
          return (
            <div key={t.id} className="fade-in" style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--surface)',
              border: '1px solid var(--border)', borderLeft: `3px solid ${color[t.type]}`,
              borderRadius: 12, padding: '12px 14px', boxShadow: 'var(--shadow-lg)',
            }}>
              <Icon size={18} style={{ color: color[t.type], flex: 'none', marginTop: 1 }} />
              <span style={{ fontSize: 13.5, color: 'var(--text)', flex: 1 }}>{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ color: 'var(--text-3)', display: 'flex' }}><X size={15} /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

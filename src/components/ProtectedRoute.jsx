import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './UI'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner full label="Checking your session…" />
  if (!user) {
    if (location.pathname.startsWith('/manager/')) {
      const parts = location.pathname.split('/')
      const slug = parts[2] || 'engineering'
      return <Navigate to={`/manager/${slug}/login`} state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return children
}

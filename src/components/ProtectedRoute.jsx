import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './UI'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner full label="Checking your session…" />
  if (!user) {
    const lastEmp = localStorage.getItem('last_emp_code')
    if (lastEmp && location.pathname.includes('my-trainings')) {
      return <Navigate to={`/emp/${lastEmp}`} state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return children
}

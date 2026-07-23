import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { apiPost, apiGet } from '../api/client'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hr_user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Re-validate the stored token on first load.
  useEffect(() => {
    const token = localStorage.getItem('hr_token')
    if (!token) { setLoading(false); return }
    apiGet('/auth/me')
      .then((data) => {
        const u = data?.user || data
        setUser(u)
        localStorage.setItem('hr_user', JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem('hr_token')
        localStorage.removeItem('hr_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await apiPost('/auth/login', { email, password })
    localStorage.setItem('hr_token', data.token)
    localStorage.setItem('hr_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const collegeLogin = useCallback(async (slug, email, password) => {
    const data = await apiPost(`/auth/college/${slug}/login`, { email, password })
    localStorage.setItem('hr_token', data.token)
    localStorage.setItem('hr_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const data = await apiPost('/auth/register', payload)
    if (data?.token) {
      localStorage.setItem('hr_token', data.token)
      localStorage.setItem('hr_user', JSON.stringify(data.user))
      setUser(data.user)
    }
    return data
  }, [])

  const loginWithSession = useCallback((token, u) => {
    localStorage.setItem('hr_token', token)
    localStorage.setItem('hr_user', JSON.stringify(u))
    if (u?.employee_code) {
      localStorage.setItem('last_emp_code', u.employee_code)
    }
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hr_token')
    localStorage.removeItem('hr_user')
    setUser(null)
    delete api.defaults.headers.common.Authorization
  }, [])

  const hasRole = useCallback((...roles) => user && roles.includes(user.role), [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, collegeLogin, loginWithSession, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

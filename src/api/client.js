import axios from 'axios'

// Base URL comes exclusively from the environment — never hardcoded.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach JWT on every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hr_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalise errors into a readable message and handle expired sessions.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    if (status === 401 && !error.config?.url?.includes('/auth/login') && !error.config?.url?.includes('/auth/manager-login')) {
      localStorage.removeItem('hr_token')
      localStorage.removeItem('hr_user')
      const path = window.location.pathname
      const isLoginPage = path.startsWith('/login') || path.includes('/login')
      const isCareersPage = path.startsWith('/careers')
      const isHomePage = path === '/'
      if (!isLoginPage && !isCareersPage && !isHomePage) {
        // Redirect managers to their department login page
        const managerMatch = path.match(/^\/manager\/([^/]+)/)
        if (managerMatch) {
          window.location.href = `/manager/${managerMatch[1]}/login`
        } else {
          window.location.href = '/login'
        }
      }
    }
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : null) ||
      (error.message === 'Network Error'
        ? 'Cannot reach the server. Check that the backend is running.'
        : 'Something went wrong. Please try again.')
    return Promise.reject({ message, status, errors: error.response?.data?.errors || [], raw: error })
  }
)

// Convenience: unwrap the standard { success, message, data } envelope.
export async function apiGet(url, config) {
  const res = await api.get(url, config)
  return res.data?.data ?? res.data
}
export async function apiPost(url, body, config) {
  const res = await api.post(url, body, config)
  return res.data?.data ?? res.data
}
export async function apiPut(url, body, config) {
  const res = await api.put(url, body, config)
  return res.data?.data ?? res.data
}
export async function apiDelete(url, config) {
  const res = await api.delete(url, config)
  return res.data?.data ?? res.data
}

export async function apiGetBlob(url, config = {}) {
  const res = await api.get(url, { ...config, responseType: 'blob' })
  return res.data
}
export { baseURL }
export default api

export async function apiPostMultipart(url, formData) {
  const token = localStorage.getItem('hr_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${baseURL}${url}`, {
    method: 'POST',
    headers,
    body: formData
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Upload failed')
  }
  return data.data ?? data
}

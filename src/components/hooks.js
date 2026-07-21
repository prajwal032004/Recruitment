import { useState, useEffect, useCallback, useRef } from 'react'
import { apiGet } from '../api/client'

// Simple data-fetching hook with loading / error / refetch.
export function useFetch(url, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const active = useRef(true)

  const run = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const d = await apiGet(url)
      if (active.current) setData(d)
    } catch (e) {
      if (active.current) setError(e.message || 'Failed to load')
    } finally {
      if (active.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    active.current = true
    run()
    return () => { active.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch: run, setData }
}

export const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f97316']

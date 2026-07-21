import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGetBlob } from '../api/client'
import { LoadingSpinner, ErrorState } from '../components/UI'

export default function DocumentViewer() {
  const [searchParams] = useSearchParams()
  const path = searchParams.get('path')
  const [blobUrl, setBlobUrl] = useState(null)
  const [textContent, setTextContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!path) {
      setError('No document path provided.')
      setLoading(false)
      return
    }

    const fetchDoc = async () => {
      try {
        const blob = await apiGetBlob(`/files/${path}`)
        if (path.toLowerCase().endsWith('.txt')) {
          const text = await blob.text()
          setTextContent(text)
        } else {
          const url = URL.createObjectURL(blob)
          setBlobUrl(url)
        }
      } catch (err) {
        setError(err.message || 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [path])

  if (loading) return <LoadingSpinner full label="Loading document..." />
  if (error) return <div style={{ padding: 40 }}><ErrorState message={error} /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--surface-2)' }}>
      <div style={{ padding: '16px 24px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>Document Viewer</h1>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-3)', padding: '4px 12px', borderRadius: '100px' }}>
          {path.split('/').pop()}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
        {textContent !== null ? (
          <div style={{ backgroundColor: 'var(--surface)', padding: '48px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', maxWidth: '850px', width: '100%', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7, color: 'var(--text-2)', fontSize: '0.95rem' }}>
            {textContent}
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '1200px', height: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
            <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'var(--surface)' }} title="Document Viewer" />
          </div>
        )}
      </div>
    </div>
  )
}

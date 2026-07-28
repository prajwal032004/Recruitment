import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  FileText, Download, Printer, Maximize2, Minimize2, ZoomIn, ZoomOut,
  ArrowLeft, File, Image, FileSpreadsheet, FileCode, Film, Music,
  RotateCcw, Copy, Check, ExternalLink, ChevronUp
} from 'lucide-react'
import { apiGetBlob } from '../api/client'
import { LoadingSpinner, ErrorState } from '../components/UI'

const MPC_LOGO = 'https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg'

/* ── File-type helpers ── */
function getFileExtension(filename) {
  if (!filename) return ''
  return filename.split('.').pop().toLowerCase()
}

function getFileTypeInfo(ext) {
  const types = {
    pdf:  { label: 'PDF Document',  icon: FileText,        color: '#ef4444', bg: '#fef2f2' },
    doc:  { label: 'Word Document', icon: FileText,        color: '#3b82f6', bg: '#eff6ff' },
    docx: { label: 'Word Document', icon: FileText,        color: '#3b82f6', bg: '#eff6ff' },
    txt:  { label: 'Text File',     icon: FileCode,        color: '#64748b', bg: '#f8fafc' },
    csv:  { label: 'Spreadsheet',   icon: FileSpreadsheet, color: '#10b981', bg: '#ecfdf5' },
    xls:  { label: 'Excel File',    icon: FileSpreadsheet, color: '#10b981', bg: '#ecfdf5' },
    xlsx: { label: 'Excel File',    icon: FileSpreadsheet, color: '#10b981', bg: '#ecfdf5' },
    png:  { label: 'Image',         icon: Image,           color: '#8b5cf6', bg: '#f5f3ff' },
    jpg:  { label: 'Image',         icon: Image,           color: '#8b5cf6', bg: '#f5f3ff' },
    jpeg: { label: 'Image',         icon: Image,           color: '#8b5cf6', bg: '#f5f3ff' },
    gif:  { label: 'Image',         icon: Image,           color: '#8b5cf6', bg: '#f5f3ff' },
    webp: { label: 'Image',         icon: Image,           color: '#8b5cf6', bg: '#f5f3ff' },
    svg:  { label: 'SVG Image',     icon: Image,           color: '#f59e0b', bg: '#fffbeb' },
    mp4:  { label: 'Video',         icon: Film,            color: '#ec4899', bg: '#fdf2f8' },
    webm: { label: 'Video',         icon: Film,            color: '#ec4899', bg: '#fdf2f8' },
    mp3:  { label: 'Audio',         icon: Music,           color: '#06b6d4', bg: '#ecfeff' },
    wav:  { label: 'Audio',         icon: Music,           color: '#06b6d4', bg: '#ecfeff' },
  }
  return types[ext] || { label: 'Document', icon: File, color: '#64748b', bg: '#f8fafc' }
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const isImageExt = (ext) => ['png','jpg','jpeg','gif','webp','svg','bmp'].includes(ext)

export default function DocumentViewer() {
  const [searchParams] = useSearchParams()
  const path = searchParams.get('path')
  const [blobUrl, setBlobUrl] = useState(null)
  const [textContent, setTextContent] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [copied, setCopied] = useState(false)
  const [blobData, setBlobData] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  const containerRef = useRef(null)
  const contentRef = useRef(null)

  const filename = path ? path.split('/').pop() : 'Unknown'
  const ext = getFileExtension(filename)
  const typeInfo = getFileTypeInfo(ext)
  const TypeIcon = typeInfo.icon

  useEffect(() => {
    if (!path) {
      setError('No document path provided.')
      setLoading(false)
      return
    }

    const fetchDoc = async () => {
      try {
        const blob = await apiGetBlob(`/files/${path}`)
        setBlobData(blob)
        if (ext === 'txt' || ext === 'csv' || ext === 'json' || ext === 'md' || ext === 'log') {
          const text = await blob.text()
          setTextContent(text)
        } else if (isImageExt(ext)) {
          const url = URL.createObjectURL(blob)
          setImageUrl(url)
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
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [path])

  /* ── Scroll tracking ── */
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 20)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [loading])

  /* ── Actions ── */
  const handleDownload = useCallback(() => {
    if (!blobData) return
    const url = URL.createObjectURL(blobData)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [blobData, filename])

  const handlePrint = useCallback(() => {
    if (textContent !== null) {
      const w = window.open('', '_blank')
      w.document.write(`<pre style="font-family:monospace;white-space:pre-wrap;padding:40px;">${textContent}</pre>`)
      w.document.close()
      w.print()
    } else if (blobUrl) {
      const w = window.open(blobUrl, '_blank')
      setTimeout(() => w?.print(), 500)
    }
  }, [textContent, blobUrl])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleCopyText = useCallback(async () => {
    if (textContent === null) return
    try {
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [textContent])

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

  /* ── Render states ── */
  if (loading) {
    return (
      <div className="dv-root">
        <style>{viewerStyles}</style>
        <div className="dv-loading-wrapper">
          <div className="dv-loading-card">
            <div className="dv-pulse-ring" />
            <LoadingSpinner label="Fetching your document…" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dv-root">
        <style>{viewerStyles}</style>
        <div className="dv-error-wrapper">
          <div className="dv-error-card">
            <ErrorState message={error} />
            <Link to="/app" className="btn btn-ghost btn-sm" style={{ marginTop: 16, gap: 6 }}>
              <ArrowLeft size={15} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dv-root" ref={containerRef}>
      <style>{viewerStyles}</style>

      {/* ─── Premium Top Bar ─── */}
      <header className={`dv-topbar${scrolled ? ' dv-topbar--scrolled' : ''}`}>
        <div className="dv-topbar-left">
          <Link to="/app" className="dv-back-btn" title="Back to Dashboard">
            <ArrowLeft size={18} />
          </Link>

          <div className="dv-topbar-divider" />

          <Link to="/" className="dv-logo-link">
            <img src={MPC_LOGO} alt="MPC Logo" className="dv-logo" />
          </Link>

          <div className="dv-topbar-divider dv-hide-mobile" />

          <div className="dv-file-info dv-hide-mobile">
            <div className="dv-file-badge" style={{ background: typeInfo.bg, color: typeInfo.color }}>
              <TypeIcon size={13} />
              <span>{typeInfo.label}</span>
            </div>
            <h1 className="dv-filename">{filename}</h1>
          </div>
        </div>

        <div className="dv-topbar-right">
          {/* Zoom controls for text content */}
          {textContent !== null && (
            <div className="dv-zoom-controls dv-hide-mobile">
              <button className="dv-tool-btn" onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out">
                <ZoomOut size={16} />
              </button>
              <span className="dv-zoom-label">{zoom}%</span>
              <button className="dv-tool-btn" onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom in">
                <ZoomIn size={16} />
              </button>
              <button className="dv-tool-btn" onClick={() => setZoom(100)} title="Reset zoom" style={{ marginLeft: 2 }}>
                <RotateCcw size={14} />
              </button>
            </div>
          )}

          {textContent !== null && <div className="dv-topbar-divider dv-hide-mobile" />}

          {/* Copy text button */}
          {textContent !== null && (
            <button className="dv-tool-btn" onClick={handleCopyText} title="Copy text">
              {copied ? <Check size={16} style={{ color: 'var(--green-500)' }} /> : <Copy size={16} />}
            </button>
          )}

          {/* Download */}
          <button className="dv-tool-btn" onClick={handleDownload} title="Download file">
            <Download size={16} />
          </button>

          {/* Print */}
          <button className="dv-tool-btn" onClick={handlePrint} title="Print document">
            <Printer size={16} />
          </button>

          {/* Fullscreen */}
          <button className="dv-tool-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Open in new tab */}
          {(blobUrl || imageUrl) && (
            <a className="dv-tool-btn" href={blobUrl || imageUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab">
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </header>

      {/* ─── Mobile file info (below topbar) ─── */}
      <div className="dv-mobile-info">
        <div className="dv-file-badge" style={{ background: typeInfo.bg, color: typeInfo.color }}>
          <TypeIcon size={12} />
          <span>{typeInfo.label}</span>
        </div>
        <span className="dv-mobile-filename">{filename}</span>
      </div>

      {/* ─── Content Area ─── */}
      <main className="dv-content" ref={contentRef}>
        <div className="dv-content-inner">
          {textContent !== null ? (
            <div className="dv-text-document" style={{ fontSize: `${zoom}%` }}>
              <div className="dv-text-header">
                <div className="dv-text-header-icon" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                  <TypeIcon size={20} />
                </div>
                <div>
                  <h2 className="dv-text-title">{filename}</h2>
                  <p className="dv-text-meta">
                    {textContent.split('\n').length} lines · {formatFileSize(new Blob([textContent]).size)}
                  </p>
                </div>
              </div>
              <div className="dv-text-body">
                {textContent.split('\n').map((line, i) => (
                  <div key={i} className="dv-text-line">
                    <span className="dv-line-num">{i + 1}</span>
                    <span className="dv-line-content">{line || '\u00A0'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : imageUrl ? (
            <div className="dv-image-container">
              <img src={imageUrl} alt={filename} className="dv-image-preview" />
              <div className="dv-image-caption">
                <TypeIcon size={14} style={{ color: typeInfo.color }} />
                <span>{filename}</span>
              </div>
            </div>
          ) : (
            <div className="dv-iframe-container">
              <iframe
                src={blobUrl}
                className="dv-iframe"
                title="Document Viewer"
              />
            </div>
          )}
        </div>
      </main>

      {/* ─── Scroll to top FAB ─── */}
      <button
        className={`dv-scroll-top${scrolled ? ' dv-scroll-top--visible' : ''}`}
        onClick={scrollToTop}
        title="Scroll to top"
      >
        <ChevronUp size={20} />
      </button>
    </div>
  )
}


/* ═══════════════════════════════════════════
   Premium CSS — embedded for self-containment
   ═══════════════════════════════════════════ */
const viewerStyles = `
/* ── Root container ── */
.dv-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(160deg, #f0f0f7 0%, #f6f8fc 40%, #fdf2f8 100%);
  position: relative;
  overflow: hidden;
}

/* ── Animated background pattern ── */
.dv-root::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -120px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(197,48,123,0.06) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: dv-float 8s ease-in-out infinite;
}
.dv-root::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: dv-float 10s ease-in-out infinite reverse;
}
@keyframes dv-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.05); }
}

/* ── Top Bar ── */
.dv-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  min-height: 60px;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(226,232,240,0.6);
  z-index: 100;
  position: relative;
  transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
}
.dv-topbar--scrolled {
  box-shadow: 0 4px 24px -4px rgba(15,23,42,0.08), 0 2px 8px -2px rgba(15,23,42,0.04);
  border-bottom-color: transparent;
}

.dv-topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.dv-topbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.dv-topbar-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}

/* ── Back button ── */
.dv-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--text-2);
  transition: all 0.2s ease;
  flex-shrink: 0;
  text-decoration: none;
}
.dv-back-btn:hover {
  background: var(--surface-2);
  color: var(--brand-500);
  transform: translateX(-2px);
}

/* ── Logo ── */
.dv-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}
.dv-logo {
  height: 34px;
  width: auto;
  object-fit: contain;
  transition: opacity 0.2s ease;
}
.dv-logo:hover {
  opacity: 0.8;
}

/* ── File info (desktop) ── */
.dv-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dv-file-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
  flex-shrink: 0;
}
.dv-filename {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Inter', sans-serif;
  max-width: 280px;
}

/* ── Mobile file info bar ── */
.dv-mobile-info {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}
.dv-mobile-filename {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Zoom controls ── */
.dv-zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--surface-2);
  border-radius: 10px;
  padding: 2px 4px;
  border: 1px solid var(--border);
}
.dv-zoom-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  min-width: 38px;
  text-align: center;
  user-select: none;
}

/* ── Toolbar buttons ── */
.dv-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  flex-shrink: 0;
}
.dv-tool-btn:hover {
  background: var(--surface-2);
  color: var(--brand-500);
  transform: translateY(-1px);
}
.dv-tool-btn:active {
  transform: scale(0.95);
}

/* ── Content area ── */
.dv-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
  position: relative;
  z-index: 1;
}
.dv-content-inner {
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  animation: dv-fadeIn 0.4s ease-out;
}
@keyframes dv-fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Text document view ── */
.dv-text-document {
  background: var(--surface);
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(15,23,42,0.04),
    0 8px 32px -8px rgba(15,23,42,0.08),
    0 0 0 1px rgba(226,232,240,0.8);
  max-width: 900px;
  width: 100%;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}
.dv-text-document:hover {
  box-shadow:
    0 1px 3px rgba(15,23,42,0.04),
    0 12px 40px -8px rgba(15,23,42,0.12),
    0 0 0 1px rgba(226,232,240,0.9);
}

.dv-text-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 28px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
}
.dv-text-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.dv-text-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  font-family: 'Outfit', sans-serif;
}
.dv-text-meta {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: var(--text-3);
  font-weight: 500;
}

.dv-text-body {
  padding: 4px 0;
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  line-height: 1.75;
  color: var(--text-2);
}
.dv-text-line {
  display: flex;
  padding: 0 28px 0 0;
  transition: background 0.15s ease;
}
.dv-text-line:hover {
  background: rgba(197,48,123,0.03);
}
.dv-line-num {
  flex-shrink: 0;
  width: 56px;
  padding: 0 16px 0 0;
  text-align: right;
  color: var(--text-3);
  font-size: 12px;
  user-select: none;
  opacity: 0.7;
  border-right: 1px solid var(--border);
  margin-right: 16px;
}
.dv-line-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Image preview ── */
.dv-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 1000px;
  width: 100%;
}
.dv-image-preview {
  max-width: 100%;
  max-height: calc(100vh - 180px);
  object-fit: contain;
  border-radius: 16px;
  box-shadow:
    0 4px 16px rgba(15,23,42,0.08),
    0 0 0 1px rgba(226,232,240,0.6);
  background: var(--surface);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.dv-image-preview:hover {
  transform: scale(1.01);
  box-shadow:
    0 8px 32px rgba(15,23,42,0.12),
    0 0 0 1px rgba(226,232,240,0.8);
}
.dv-image-caption {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-3);
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid var(--border);
}

/* ── iframe (PDF, etc.) ── */
.dv-iframe-container {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  min-height: calc(100vh - 140px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(15,23,42,0.08),
    0 0 0 1px rgba(226,232,240,0.6);
  background: var(--surface);
  transition: box-shadow 0.3s ease;
}
.dv-iframe-container:hover {
  box-shadow:
    0 8px 32px rgba(15,23,42,0.12),
    0 0 0 1px rgba(226,232,240,0.8);
}
.dv-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--surface);
}

/* ── Scroll to top FAB ── */
.dv-scroll-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--brand-gradient);
  color: #fff;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-glow);
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  pointer-events: none;
  transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
  z-index: 200;
}
.dv-scroll-top--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.dv-scroll-top:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 32px rgba(197,48,123,0.35);
}
.dv-scroll-top:active {
  transform: scale(0.95);
}

/* ── Loading state ── */
.dv-loading-wrapper {
  flex: 1;
  display: grid;
  place-items: center;
  position: relative;
  z-index: 1;
}
.dv-loading-card {
  position: relative;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 48px 56px;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(226,232,240,0.6);
}
.dv-pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 2px solid var(--brand-200);
  animation: dv-pulse 2s ease-in-out infinite;
}
@keyframes dv-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

/* ── Error state ── */
.dv-error-wrapper {
  flex: 1;
  display: grid;
  place-items: center;
  position: relative;
  z-index: 1;
}
.dv-error-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px 48px;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(226,232,240,0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Fullscreen adjustments ── */
.dv-root:fullscreen {
  background: linear-gradient(160deg, #f0f0f7 0%, #f6f8fc 40%, #fdf2f8 100%);
}
.dv-root:fullscreen .dv-topbar {
  background: rgba(255,255,255,0.95);
}

/* ═══ Responsive ═══ */
@media (max-width: 900px) {
  .dv-topbar {
    padding: 0 12px;
    height: 54px;
    min-height: 54px;
  }
  .dv-filename {
    max-width: 180px;
    font-size: 13px;
  }
  .dv-content {
    padding: 16px;
  }
  .dv-text-header {
    padding: 16px 20px;
  }
  .dv-text-body {
    font-size: 13px;
  }
  .dv-line-num {
    width: 44px;
    padding-right: 10px;
    margin-right: 10px;
    font-size: 11px;
  }
  .dv-text-line {
    padding-right: 20px;
  }
  .dv-iframe-container {
    border-radius: 12px;
    min-height: calc(100vh - 120px);
  }
}

@media (max-width: 640px) {
  .dv-hide-mobile {
    display: none !important;
  }
  .dv-mobile-info {
    display: flex;
  }
  .dv-topbar {
    padding: 0 10px;
    height: 50px;
    min-height: 50px;
    gap: 4px;
  }
  .dv-topbar-left {
    gap: 8px;
  }
  .dv-topbar-right {
    gap: 0;
  }
  .dv-tool-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }
  .dv-back-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }
  .dv-logo {
    height: 28px;
  }
  .dv-content {
    padding: 12px 10px;
  }
  .dv-text-document {
    border-radius: 12px;
  }
  .dv-text-header {
    padding: 14px 16px;
    gap: 10px;
  }
  .dv-text-header-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }
  .dv-text-title {
    font-size: 14px;
  }
  .dv-line-num {
    width: 36px;
    padding-right: 8px;
    margin-right: 8px;
    font-size: 10px;
  }
  .dv-text-line {
    padding-right: 14px;
  }
  .dv-iframe-container {
    border-radius: 10px;
  }
  .dv-image-preview {
    border-radius: 12px;
  }
  .dv-scroll-top {
    bottom: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  .dv-loading-card {
    padding: 36px 32px;
    border-radius: 16px;
  }
  .dv-error-card {
    padding: 32px 24px;
    border-radius: 16px;
    margin: 0 12px;
  }
}

@media (max-width: 380px) {
  .dv-topbar-divider {
    display: none;
  }
  .dv-topbar-left {
    gap: 6px;
  }
  .dv-tool-btn {
    width: 32px;
    height: 32px;
  }
  .dv-logo {
    height: 24px;
  }
}
`

import { useRef, useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'

export default function FileUploader({ accept, hint, onFile, file, disabled }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  const handle = (f) => { if (f) onFile(f) }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]) }}
        style={{
          border: `1.5px dashed ${drag ? 'var(--brand-400)' : 'var(--border-2)'}`,
          background: drag ? 'var(--brand-50)' : 'var(--surface-2)',
          borderRadius: 12, padding: '26px 20px', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all .15s', opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-100)', color: 'var(--brand-600)', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
          <UploadCloud size={22} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>Click to upload or drag & drop</div>
        {hint && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{hint}</div>}
        <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
          onChange={(e) => handle(e.target.files?.[0])} />
      </div>
      {file && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '10px 13px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>
          <FileText size={18} style={{ color: 'var(--brand-500)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onFile(null) }} style={{ color: 'var(--text-3)', display: 'flex' }}><X size={16} /></button>
        </div>
      )}
    </div>
  )
}

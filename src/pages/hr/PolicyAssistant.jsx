import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquareText, Send, Upload, RefreshCw, Trash2, FileText, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { apiGet, apiPost, apiDelete, apiPostMultipart } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { PageHeader, LoadingSpinner, Badge, EmptyState } from '../../components/UI'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'

export default function PolicyAssistant() {
  const toast = useToast()
  const { user } = useAuth()
  const isStaff = user?.role === 'ADMIN' || user?.role === 'HR'
  
  // Chat state
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hello! I am the HR Policy Assistant. Ask me anything about our uploaded policies.' }])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  
  // Manager state
  const [managerOpen, setManagerOpen] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { data: suggested } = useFetch('/policy/suggested')
  const { data: docsData, loading: docsLoading, refetch: refetchDocs } = useFetch(isStaff ? '/policy/documents' : null)
  const docs = docsData?.items || []
  
  const chatRef = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const ask = async (qText) => {
    if (!qText.trim()) return
    const text = qText.trim()
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setAsking(true)
    
    try {
      const res = await apiPost('/policy/ask', { question: text })
      const ansObj = res?.answer ? res : (res?.data || res)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: ansObj.answer || 'I could not find an answer in the uploaded documents.',
        sources: ansObj.sources || [],
        confidence: ansObj.confidence || 0
      }])
    } catch (e) {
      const errTxt = e?.message || e?.error || 'Could not reach the policy assistant service.'
      toast.error(errTxt)
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${errTxt}` }])
    } finally {
      setAsking(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const form = e.target
    const file = form.file.files[0]
    if (!file) return toast.error('Select a file')
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', form.title.value)
    formData.append('category', form.category.value)
    
    setUploading(true)
    try {
      const res = await apiPostMultipart('/policy/documents', formData)
      toast.success(res.message)
      form.reset()
      refetchDocs()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await apiDelete(`/policy/documents/${id}`)
      toast.success('Document deleted and index rebuilt')
      refetchDocs()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleRebuild = async () => {
    try {
      const res = await apiPost('/policy/rebuild-index', {})
      toast.success(`Index rebuilt. Chunks: ${res.chunks}`)
      refetchDocs()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <PageHeader 
        title={isStaff ? "HR Policy Storage" : "HR Policy Assistant"} 
        subtitle={isStaff ? "Manage policy documents and interact with them" : "Interact with uploaded HR and company policies"} 
        icon={MessageSquareText} 
      />

      <div className="pa-chat-container mb-4" style={{ height: 'auto' }}>
        {isStaff && (
          <div className="manager-header row-between" onClick={() => setManagerOpen(!managerOpen)} style={{ padding: '16px 24px', cursor: 'pointer', userSelect: 'none', background: 'var(--surface-2)', borderBottom: managerOpen ? '1px solid var(--border)' : 'none', transition: 'all 0.2s' }}>
            <div className="row-align" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'var(--brand-100)', color: 'var(--brand-600)', padding: '8px', borderRadius: '8px' }}>
                <FileText size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Document Manager</h3>
            </div>
            {managerOpen ? <ChevronUp size={20} className="muted" /> : <ChevronDown size={20} className="muted" />}
          </div>
        )}
        
        {isStaff && managerOpen && (
          <div style={{ padding: '24px', background: '#ffffff' }}>
            <form className="flex wrap align-end mb-5" style={{ gap: 16, background: 'var(--surface-2)', padding: '20px', borderRadius: '12px', border: '1px dashed var(--border-2)' }} onSubmit={handleUpload}>
              <div className="field flex-1" style={{ minWidth: 200 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Document Title</label>
                <input name="title" className="pa-input" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }} placeholder="e.g. Leave Policy 2026" required />
              </div>
              <div className="field flex-1" style={{ minWidth: 200 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>Category</label>
                <select name="category" className="pa-input" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', width: '100%', cursor: 'pointer' }} defaultValue="General">
                  <option value="General">General</option>
                  <option value="Leaves & Attendance">Leaves & Attendance</option>
                  <option value="Benefits & Perks">Benefits & Perks</option>
                  <option value="Code of Conduct">Code of Conduct</option>
                  <option value="Recruitment">Recruitment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field flex-1" style={{ minWidth: 200 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>File (PDF/TXT)</label>
                <input name="file" type="file" className="pa-input" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 14px', width: '100%' }} accept=".pdf,.txt" required />
              </div>
              <button type="submit" className="pa-send-btn" style={{ width: 'auto', padding: '0 24px', borderRadius: '8px', gap: 8, height: 42 }} disabled={uploading}>
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload & Index'}
              </button>
            </form>

            <div className="row-between mb-3">
              <h4 style={{ margin: 0, fontSize: 15 }}>Uploaded Policies</h4>
              <button className="btn-soft btn-sm" onClick={handleRebuild}><RefreshCw size={14} /> Rebuild Index</button>
            </div>
            
            {docsLoading ? <LoadingSpinner /> : docs.length === 0 ? (
              <EmptyState icon={FileText} title="No policy documents yet" message="Upload one to start using the assistant." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {docs.map(d => (
                  <div key={d.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--brand-100)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={22} />
                      </div>
                      <Badge variant="badge-gray" style={{ background: 'var(--surface-2)' }}>{d.category}</Badge>
                    </div>
                    <div style={{ flex: 1, marginBottom: '20px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--text)', display: 'block', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</strong>
                      <div style={{ fontSize: '13px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <Link to={`/viewer?path=${encodeURIComponent(d.rel_path || '')}`} target="_blank" rel="noreferrer" className="btn-soft btn-sm" style={{ flex: 1, padding: '8px', textDecoration: 'none', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="View File">
                        <Eye size={14} /> View
                      </Link>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(d.id)} style={{ padding: '8px 12px', background: '#fff', border: '1px solid var(--border)', color: 'var(--danger)' }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pa-chat-container">
        <div className="pa-chat-log" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={`pa-bubble ${m.role}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3">
                  <strong style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sourced from</strong>
                  {m.sources.map((s, j) => (
                    <div key={j} className="pa-source-card">
                      <div className="row-between mb-2">
                        <Badge variant="badge-gray">{s.title}</Badge>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-600)' }}>{s.score}% Match</span>
                      </div>
                      <div style={{ fontStyle: 'italic', color: 'var(--text-2)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{s.snippet}"
                      </div>
                      {s.rel_path && (
                        <div style={{ marginTop: '10px' }}>
                          <Link to={`/viewer?path=${encodeURIComponent(s.rel_path)}`} target="_blank" rel="noreferrer" className="pa-chip" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--brand-100)', color: 'var(--brand-600)', border: 'none', padding: '6px 12px' }}>
                            <FileText size={12} /> View Source Document
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {asking && (
            <div className="pa-bubble assistant">
              <div className="flex" style={{ gap: 8, alignItems: 'center', height: 24 }}>
                <span className="dot-pulse"></span>
                <span className="dot-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="dot-pulse" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>
        
        {suggested && suggested.length > 0 && (
          <div className="pa-suggestions">
            {suggested.map(sq => (
              <button type="button" key={sq} className="pa-chip" onClick={() => ask(sq)}>{sq}</button>
            ))}
          </div>
        )}

        <div className="pa-input-area">
          <form className="pa-input-wrapper" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
            <input 
              className="pa-input" 
              placeholder="Ask a question about HR policies..." 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={asking}
            />
            <button type="submit" className="pa-send-btn" disabled={asking || !question.trim()}>
              <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .pa-chat-container {
          display: flex;
          flex-direction: column;
          height: 650px;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
          border: 1px solid var(--border);
        }
        .pa-chat-log {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #fdf3f8 100%);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pa-bubble {
          max-width: 85%;
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 15px;
          line-height: 1.5;
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform-origin: bottom;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(15px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pa-bubble.assistant {
          align-self: flex-start;
          background: #ffffff;
          color: var(--text);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
        }
        .pa-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(197, 48, 123, 0.2);
        }
        .pa-source-card {
          margin-top: 12px;
          padding: 12px;
          background: var(--surface-2);
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 13px;
        }
        .pa-suggestions {
          padding: 16px 24px 0 24px;
          background: #ffffff;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pa-chip {
          padding: 8px 16px;
          background: var(--brand-50);
          color: var(--brand-600);
          border: 1px solid var(--brand-200);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pa-chip:hover {
          background: var(--brand-gradient);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(197, 48, 123, 0.2);
        }
        .pa-input-area {
          padding: 16px 24px 24px 24px;
          background: #ffffff;
        }
        .pa-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 30px;
          padding: 6px 6px 6px 20px;
          transition: all 0.2s ease;
        }
        .pa-input-wrapper:focus-within {
          border-color: var(--brand-400);
          box-shadow: 0 0 0 4px var(--brand-100);
          background: #ffffff;
        }
        .pa-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 15px;
          padding: 8px 0;
        }
        .pa-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .pa-send-btn:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 6px 14px rgba(197, 48, 123, 0.3);
        }
        .pa-send-btn:disabled {
          background: var(--border-2);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  )
}

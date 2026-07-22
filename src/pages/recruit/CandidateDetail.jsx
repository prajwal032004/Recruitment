import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Building, Star, Search, MessageSquare, Save, Download } from 'lucide-react'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, PageHeader, Badge, Avatar } from '../../components/UI'
import { apiPut, baseURL } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'

export default function CandidateDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { data: cand, loading, error, refetch } = useFetch(`/candidates/${id}`)
  
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  
  // Chatbot state
  const [chatQuery, setChatQuery] = useState('')
  const [chatResults, setChatResults] = useState([])

  // Init notes when data loads
  const adminNotes = cand?.extracted?.admin_notes || ''

  const handleSaveNote = async () => {
    setSavingNote(true)
    try {
      await apiPut(`/candidates/${id}/notes`, { notes: note || adminNotes })
      toast.success('Notes saved successfully')
      refetch()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSavingNote(false)
    }
  }

  const handleChatSearch = (e) => {
    e.preventDefault()
    if (!chatQuery.trim() || !cand?.resume_text) return
    const text = cand.resume_text
    // Split by newlines or periods to get sentences/blocks
    const sentences = text.split(/(?<=\.)\s+|\n+/).filter(Boolean)
    const q = chatQuery.toLowerCase()
    const matches = sentences.filter(s => s.toLowerCase().includes(q)).slice(0, 5) // top 5 matches
    
    setChatResults(prev => [
      ...prev,
      { type: 'user', text: chatQuery },
      { type: 'bot', text: matches.length ? matches : ['No direct matches found in the resume text.'] }
    ])
    setChatQuery('')
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!cand) return null

  const avatarContent = <Avatar name={cand.name} src={cand.profile_image} size={80} />

  return (
    <div className="fade-in">
      <button 
        className="flex muted mb-4" 
        style={{ gap: 6, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.2s', background: 'transparent', border: 'none' }} 
        onClick={() => nav('/app/candidates')}
      >
        <ArrowLeft size={16} /> Back to candidates
      </button>

      <PageHeader 
        title={
          <div className="flex" style={{ gap: 20, alignItems: 'center' }}>
            <div style={{ boxShadow: 'var(--shadow-md)', borderRadius: '50%', padding: '2px', background: 'var(--border-light)' }}>
              {avatarContent}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>{cand.name}</div>
              <div className="flex wrap mt-2" style={{ gap: 16, fontSize: 13.5, fontWeight: 500, color: 'var(--text-3)' }}>
                {cand.email && <span className="flex" style={{ gap: 6, alignItems: 'center' }}><Mail size={14}/> {cand.email}</span>}
                {cand.phone && <span className="flex" style={{ gap: 6, alignItems: 'center' }}><Phone size={14}/> {cand.phone}</span>}
                {cand.college_name && <span className="flex" style={{ gap: 6, alignItems: 'center' }}><Building size={14}/> {cand.college_name}</span>}
              </div>
            </div>
          </div>
        }
      />

      <div className="two-col mt-6" style={{ alignItems: 'start', gap: 24 }}>
        {/* Left Column: Details & Notes */}
        <div className="stack" style={{ gap: 24 }}>
          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
            <h3 className="h2 mb-4 flex" style={{ gap: 8, fontSize: 16, fontWeight: 700, alignItems: 'center' }}>
              <User size={18} style={{ color: 'var(--brand-600)' }} /> Profile Overview
            </h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Degree & Branch</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.degree || '—'} {cand.branch ? `(${cand.branch})` : ''}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Graduation Year</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.graduation_year || '—'}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>CGPA</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.cgpa || '—'}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>10th %</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.tenth_pct || '—'}%</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>12th %</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.twelfth_pct || '—'}%</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Active Backlogs</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.backlogs ?? '0'}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Experience</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{cand.experience_years || '0'} years</div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Source</div>
                <Badge variant="badge-gray" style={{ fontSize: 11.5 }}>{cand.first_source}</Badge>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Talent Pool</div>
                <Badge variant={cand.in_talent_pool ? 'badge-amber' : 'badge-gray'} style={{ fontSize: 11.5 }}>{cand.in_talent_pool ? 'Yes' : 'No'}</Badge>
              </div>
            </div>
            <div className="divider" style={{ margin: '24px 0' }} />
            <div className="muted mb-3" style={{ fontSize: 11.5, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Key Skills</div>
            <div className="flex wrap" style={{ gap: 6 }}>
              {cand.skills?.length > 0 ? cand.skills.map(s => <span key={s} className="chip" style={{ fontSize: 12, padding: '4px 10px', background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)', borderRadius: '6px', fontWeight: 500 }}>{s}</span>) : '—'}
            </div>
          </div>

          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
            <h3 className="h2 mb-2 flex" style={{ gap: 8, fontSize: 16, fontWeight: 700, alignItems: 'center' }}>
              <Save size={18} style={{ color: 'var(--brand-600)' }} /> HR Notes
            </h3>
            <p className="muted mb-4" style={{ fontSize: 13 }}>Add private notes or internal summaries for this candidate.</p>
            <textarea 
              className="input mb-4" 
              rows={4} 
              placeholder="Enter private recruiter notes..." 
              style={{ fontSize: 13.5, lineHeight: 1.5 }}
              value={note !== '' ? note : adminNotes} 
              onChange={e => setNote(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleSaveNote} disabled={savingNote} style={{ fontWeight: 600, padding: '10px 20px', borderRadius: 8 }}>
                {savingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {cand.resume_file && (
            <div className="card card-pad flex row-between" style={{ alignItems: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
              <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
                <div style={{ padding: 10, background: 'var(--brand-50)', color: 'var(--brand-600)', borderRadius: 10 }}><Download size={20} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Resume Document</div>
                  <div className="muted" style={{ fontSize: 12 }}>Original PDF upload</div>
                </div>
              </div>
              <a href={`${baseURL}/files/${cand.resume_file}?token=${localStorage.getItem('hr_token')}`} target="_blank" rel="noreferrer" className="btn-soft" style={{ fontWeight: 600, padding: '10px 18px', borderRadius: 8 }}>View Document</a>
            </div>
          )}
        </div>

        {/* Right Column: Chatbot & Resume Text */}
        <div className="stack" style={{ gap: 24 }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 480, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="flex" style={{ gap: 8, fontSize: 16, fontWeight: 700, margin: 0 }}><MessageSquare size={18} style={{ color: 'var(--brand-600)' }} /> Keyword Search Chatbot</h2>
              <Badge variant="badge-green" style={{ fontSize: 11 }}>Zero-RAG Mode</Badge>
            </div>
            
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatResults.length === 0 ? (
                <div className="muted" style={{ textAlign: 'center', marginTop: 60, fontSize: 13, padding: '0 24px', lineHeight: 1.6 }}>
                  Type a keyword below to instantly extract matching lines and sections from the candidate's resume.<br/><br/>Try: <strong style={{ color: 'var(--brand-700)' }}>"React"</strong>, <strong style={{ color: 'var(--brand-700)' }}>"Python"</strong>, or <strong style={{ color: 'var(--brand-700)' }}>"Intern"</strong>.
                </div>
              ) : (
                chatResults.map((msg, i) => (
                  <div key={i} style={{ 
                    alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.type === 'user' ? 'var(--brand-600)' : 'var(--surface)',
                    color: msg.type === 'user' ? '#fff' : 'var(--text)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: msg.type === 'bot' ? '1px solid var(--border)' : 'none',
                    maxWidth: '85%',
                    fontSize: 13,
                    lineHeight: 1.5,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {msg.type === 'user' ? (
                      msg.text
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {msg.text.map((match, j) => <li key={j} style={{ marginBottom: 6 }}>{match}</li>)}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleChatSearch} className="flex" style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <input 
                className="input" 
                style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, background: 'var(--surface-2)' }} 
                placeholder="Search resume keywords..." 
                value={chatQuery}
                onChange={e => setChatQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0 16px' }}>
                <Search size={16} />
              </button>
            </form>
          </div>

          <div className="card card-pad" style={{ boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
            <h3 className="h2 mb-4" style={{ fontSize: 16, fontWeight: 700 }}>Full Extracted Resume Text</h3>
            <div style={{ 
              background: 'var(--surface-2)', 
              padding: 16, 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              maxHeight: 280,
              overflowY: 'auto',
              fontSize: 12.5,
              fontFamily: 'monospace',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {cand.resume_text || "No text extracted for this candidate."}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

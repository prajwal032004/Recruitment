import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, MapPin, Building2, Banknote, GraduationCap, 
  CheckCircle2, Upload, Briefcase, FileText, Download, User as UserIcon, Crop
} from 'lucide-react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, Badge, Modal } from '../../components/UI'
import PublicHeader from '../../components/PublicHeader'
import PublicFooter from '../../components/PublicFooter'
import { useToast } from '../../contexts/ToastContext'
import api, { baseURL } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export default function CareerDetail() {
  const { jid } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  
  const { data: job, loading, error, refetch } = useFetch(`/careers/jds/${jid}`)
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    email: user?.email || '', 
    phone: user?.phone || '', 
    college: '', branch: '', degree: '', graduation_year: '' 
  })
  const [file, setFile] = useState(null)
  
  // Cropper State
  const [imgSrc, setImgSrc] = useState('')
  const [cropModal, setCropModal] = useState(false)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [croppedBlob, setCroppedBlob] = useState(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState('')
  const imgRef = useRef(null)

  const [busy, setBusy] = useState(false)
  
  // PDF Viewer state
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [done, setDone] = useState(null)
  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // Select Image
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
        setCropModal(true)
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  const generateCroppedImage = async () => {
    const image = imgRef.current
    if (!image || !completedCrop) return

    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    canvas.toBlob((blob) => {
      if (!blob) return
      blob.name = 'dp.jpg'
      setCroppedBlob(blob)
      if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl)
      setCroppedPreviewUrl(URL.createObjectURL(blob))
      setCropModal(false)
    }, 'image/jpeg', 0.95)
  }

  const apply = async (e) => {
    e.preventDefault()
    if (!file) return toast.error("Resume document is required.")
    if (!croppedBlob) return toast.error("Professional profile picture is required.")
    
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('resume', file)
      fd.append('dp', croppedBlob, 'dp.jpg')

      const res = await api.post(`/careers/jds/${jid}/apply`, fd, { headers: { 'Content-Type': undefined } })
      const data = res.data?.data || {}
      setDone(data)
      toast.success('Application submitted successfully!')
    } catch (err) {
      toast.error(err.message || 'Could not submit application')
    } finally { setBusy(false) }
  }

  if (loading) return <div className="public-wrap"><LoadingSpinner /></div>
  if (error) return <div className="public-wrap"><ErrorState message={error} onRetry={refetch} /></div>

  return (
    <div className="fade-in mpc-page">
      <PublicHeader />
      <div className="public-wrap mpc-content">
        <button 
          className="flex muted mb-6" 
          style={{ gap: 6, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.2s' }} 
          onClick={() => nav('/careers')}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <ArrowLeft size={16} /> Back to all open roles
        </button>

        {done ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 600, margin: '0 auto', border: '1px solid var(--border)', background: '#fff' }}>
            <CheckCircle2 size={64} style={{ color: '#10b981', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#333' }}>Application submitted!</h2>
            <p className="muted mt-4" style={{ fontSize: 15 }}>Thank you for applying to the <strong>{job.title}</strong> role. Our recruitment team will review your profile and get back to you shortly.</p>
            
            {done.match_score != null && (
              <div className="mt-6" style={{ display: 'inline-block', background: '#f9f9f9', padding: '16px 24px', border: '1px solid #eee' }}>
                <p style={{ margin: 0, fontSize: 14, color: '#555', fontWeight: 600, textTransform: 'uppercase' }}>Preliminary Resume Match</p>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#c5307b', marginTop: 4 }}>{done.match_score}%</div>
              </div>
            )}
            
            <div className="flex wrap mt-8" style={{ justifyContent: 'center', gap: 16 }}>
              <Link className="mpc-btn" style={{ width: 'auto', padding: '10px 20px' }} to="/careers">Browse more roles</Link>
              <Link className="mpc-btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} to="/app/my-applications">View My Profile</Link>
            </div>
          </div>
        ) : (
          <div className="two-col mt-4">
            <div className="stack" style={{ gap: 24 }}>
              <div style={{ padding: 32, background: '#fff', border: '1px solid var(--border)' }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, color: '#333' }}>{job.title}</h1>
                
                <div className="flex wrap mt-6" style={{ gap: 16 }}>
                  {job.company && <span className="flex" style={{ gap: 6, color: '#555', fontWeight: 600 }}><Building2 size={16} /> {job.company}</span>}
                  {job.location && <span className="flex" style={{ gap: 6, color: '#555', fontWeight: 600 }}><MapPin size={16} /> {job.location}</span>}
                  {(job.ctc_min || job.ctc_max) && <span className="flex" style={{ gap: 6, color: '#555', fontWeight: 600 }}><Banknote size={16} /> {job.ctc_min}–{job.ctc_max} LPA</span>}
                  <div style={{ width: 4, height: 4, background: '#ccc', alignSelf: 'center' }} />
                  {job.employment_type && <span style={{ padding: '4px 10px', background: '#eee', color: '#555', fontSize: 12, fontWeight: 700 }}>{job.employment_type}</span>}
                </div>

                <div className="divider" style={{ margin: '32px 0' }} />

                {job.description && (
                  <>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 16 }}>About the Role</h3>
                    <p style={{ whiteSpace: 'pre-wrap', color: '#555', lineHeight: 1.8, fontSize: 15 }}>
                      {job.description}
                    </p>
                  </>
                )}

                <div className="divider" style={{ margin: '32px 0' }} />

                {job.jd_document && (
                  <>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 16 }}>Official Document</h3>
                    <div style={{ padding: 16, background: '#f9f9f9', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="flex" style={{ gap: 14, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, background: '#eee', color: '#555', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <FileText size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {job.jd_document.split('/').pop() || 'Document.pdf'}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>Attached JD File</div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setPdfModalOpen(true)} className="mpc-btn" style={{ width: 'auto', padding: '8px 16px', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                        <FileText size={14} /> View Document
                      </button>
                    </div>
                    <div className="divider" style={{ margin: '32px 0' }} />
                  </>
                )}

                {job.required_skills?.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 16 }}>Required Skills</h3>
                    <div className="flex wrap" style={{ gap: 8 }}>
                      {job.required_skills.map((s) => <span key={s} style={{ padding: '4px 12px', background: '#333', color: '#fff', fontSize: 12, fontWeight: 600 }}>{s}</span>)}
                    </div>
                  </>
                )}
                {job.preferred_skills?.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 16, marginTop: 32 }}>Preferred Skills</h3>
                    <div className="flex wrap" style={{ gap: 8 }}>
                      {job.preferred_skills.map((s) => <span key={s} style={{ padding: '4px 12px', background: '#eee', color: '#555', fontSize: 12, fontWeight: 600 }}>{s}</span>)}
                    </div>
                  </>
                )}
                
                {job.required_degree && (
                  <div className="flex mt-8" style={{ background: '#f9f9f9', padding: 16, border: '1px solid #ddd', gap: 12, alignItems: 'center' }}>
                    <div style={{ padding: 10, background: '#eee', color: '#555' }}>
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>{job.required_degree}</div>
                      <div className="muted" style={{ fontSize: 13 }}>Required Education</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ alignSelf: 'start', position: 'sticky', top: 96, background: '#fff', border: '1px solid var(--border)', padding: 32 }}>
              {job?.already_applied ? (
                <div>
                  <div className="flex mb-4" style={{ gap: 12, alignItems: 'center' }}>
                    <div style={{ padding: 10, background: '#10b981', color: '#fff', display: 'grid', placeItems: 'center' }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#333', margin: 0 }}>Application Submitted</h3>
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                        Stage: {job.my_application?.stage || 'Applied'}
                      </span>
                    </div>
                  </div>

                  <p className="muted mb-6" style={{ fontSize: 14, lineHeight: 1.6 }}>
                    You have already applied for the <strong>{job.title}</strong> position. Your application is active in our recruitment system.
                  </p>

                  {job.my_application?.match_score != null && (
                    <div style={{ background: '#f9f9f9', padding: '16px', border: '1px solid #eee', marginBottom: 20, textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#555', fontWeight: 700, textTransform: 'uppercase' }}>Resume Match Score</p>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#c5307b', marginTop: 4 }}>{job.my_application.match_score}%</div>
                    </div>
                  )}

                  {job.jd_document && (
                    <div style={{ marginBottom: 16 }}>
                      <button 
                        type="button" 
                        onClick={() => setPdfModalOpen(true)} 
                        className="mpc-btn" 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', fontSize: 13 }}
                      >
                        <FileText size={16} /> View Official JD Document
                      </button>
                    </div>
                  )}

                  <div className="stack" style={{ gap: 12 }}>
                    <Link className="mpc-btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} to="/app/my-applications">
                      View My Applications
                    </Link>
                  </div>
                </div>
              ) : (!user || user.role !== 'CANDIDATE') ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div className="flex mb-6" style={{ gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: 10, background: '#c5307b', color: '#fff' }}>
                      <Briefcase size={22} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#333', margin: 0 }}>Submit Application</h3>
                  </div>
                  <p className="muted mb-6" style={{ fontSize: 15 }}>You must be logged in as a candidate to submit an application and upload your profile.</p>
                  <div className="stack" style={{ gap: 12 }}>
                    <Link className="mpc-btn" to="/login">Login to Apply</Link>
                    <Link className="mpc-btn-outline" style={{ display: 'block' }} to="/register">Create an Account</Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex mb-6" style={{ gap: 12, alignItems: 'center' }}>
                    <div style={{ padding: 10, background: '#c5307b', color: '#fff' }}>
                      <Briefcase size={22} />
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#333' }}>Submit Application</h3>
                  </div>
                  <form onSubmit={apply} className="stack" style={{ gap: 20 }}>
                    
                    {/* Profile Picture Cropper Trigger */}
                    <div className="flex" style={{ flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ 
                        width: 100, height: 100, borderRadius: '50%', background: '#f9f9f9', 
                        border: '2px dashed #ccc', display: 'grid', placeItems: 'center', overflow: 'hidden'
                      }}>
                        {croppedPreviewUrl ? (
                          <img src={croppedPreviewUrl} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <UserIcon size={32} color="#999" />
                        )}
                      </div>
                      <div>
                        <label style={{ cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: '8px 16px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Upload size={14} /> 
                          {croppedPreviewUrl ? 'Change Profile Picture' : 'Upload Professional Photo *'}
                          <input type="file" hidden accept="image/*" onChange={onSelectFile} />
                        </label>
                      </div>
                    </div>

                    <div className="field" style={{ marginBottom: 0 }}>
                      <label style={{ color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Full name *</label>
                      <input className="mpc-input" value={form.name} required onChange={setField('name')} placeholder="e.g. Jane Doe" />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label style={{ color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Email address *</label>
                      <input className="mpc-input" type="email" value={form.email} required onChange={setField('email')} placeholder="you@example.com" />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label style={{ color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Phone number</label>
                      <input className="mpc-input" value={form.phone} onChange={setField('phone')} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label style={{ color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>College / University</label>
                      <input className="mpc-input" value={form.college} onChange={setField('college')} placeholder="e.g. MIT" />
                    </div>
                    <div className="flex" style={{ gap: 12 }}>
                      <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                        <label style={{ color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Branch / Major</label>
                        <input className="mpc-input" value={form.branch} onChange={setField('branch')} placeholder="Computer Science" />
                      </div>
                      <div className="field" style={{ width: 120, marginBottom: 0 }}>
                        <label style={{ color: '#333', fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Grad Year</label>
                        <input className="mpc-input" value={form.graduation_year} onChange={setField('graduation_year')} placeholder="2024" />
                      </div>
                    </div>
                    
                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, color: '#333', marginBottom: 8 }}>Resume Document (PDF or TXT) *</label>
                      <label style={{ cursor: 'pointer', padding: '14px', border: '2px dashed #ccc', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#555', fontWeight: 600 }}>
                        {file ? (
                          <><FileText size={18} /> {file.name}</>
                        ) : (
                          <><Upload size={18} /> Click to Upload Resume</>
                        )}
                        <input type="file" hidden accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} />
                      </label>
                    </div>
                    
                    <div className="divider" style={{ margin: '8px 0' }} />
                    
                    <button className="mpc-btn" disabled={busy}>
                      {busy ? 'Submitting Application…' : 'Submit Application'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      <Modal open={cropModal} onClose={() => setCropModal(false)} title="Crop Profile Picture"
        footer={<>
          <button className="btn-ghost" onClick={() => setCropModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={generateCroppedImage}><Crop size={16} style={{ marginRight: 6 }}/> Save & Crop</button>
        </>}>
        <div style={{ display: 'flex', justifyContent: 'center', background: '#222', borderRadius: 8, overflow: 'hidden' }}>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                style={{ maxHeight: '60vh', maxWidth: '100%' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
        </div>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} title="Job Description Document" maxWidth={800}>
        <div style={{ height: '75vh', width: '100%', background: '#eee', borderRadius: 8, overflow: 'hidden' }}>
          {job.jd_document && (
            <iframe 
              src={`${baseURL}/files/${job.jd_document}`} 
              title="PDF Viewer" 
              style={{ width: '100%', height: '100%', border: 'none' }} 
            />
          )}
        </div>
      </Modal>

      <PublicFooter />
    </div>
  )
}

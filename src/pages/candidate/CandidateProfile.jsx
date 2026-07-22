import { useState, useRef, useEffect } from 'react'
import { Upload, Camera, Save, FileText, UserCheck, GraduationCap, Award, Sparkles, Crop, ExternalLink } from 'lucide-react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { apiGet, apiPut, apiPost, baseURL } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner, ErrorState, PageHeader, Avatar, Modal } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'

export default function CandidateProfile() {
  const toast = useToast()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  // Cropper State
  const [cropModal, setCropModal] = useState(false)
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const imgRef = useRef(null)

  const fetchProfile = async () => {
    try {
      const data = await apiGet('/auth/profile')
      setProfile(data)
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        college_name: data.college_name || '',
        branch: data.branch || '',
        degree: data.degree || '',
        graduation_year: data.graduation_year || '',
        skills: data.skills ? data.skills.join(', ') : '',
        cgpa: data.cgpa || '',
        tenth_pct: data.tenth_pct || '',
        twelfth_pct: data.twelfth_pct || '',
        backlogs: data.backlogs ?? 0
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiPut('/auth/profile', form)
      toast.success('Profile updated successfully')
      fetchProfile()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      await apiPost('/auth/profile/upload-resume', fd, { headers: { 'Content-Type': undefined } })
      toast.success('Resume uploaded successfully')
      fetchProfile()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // --- Cropper Logic ---
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
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
    const size = Math.min(width, height) * 0.8
    setCrop(centerCrop(makeAspectCrop({ unit: 'px', width: size, height: size }, 1, width, height), width, height))
  }

  const handleCropSave = async () => {
    if (!completedCrop || !imgRef.current) return
    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    canvas.width = completedCrop.width
    canvas.height = completedCrop.height
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, completedCrop.width, completedCrop.height
    )
    
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const fd = new FormData()
      fd.append('file', blob, 'profile.jpg')
      
      try {
        await apiPost('/auth/profile/upload-dp', fd, { headers: { 'Content-Type': undefined } })
        toast.success('Profile picture updated!')
        setCropModal(false)
        fetchProfile()
      } catch (err) {
        toast.error(err.message)
      }
    }, 'image/jpeg')
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />

  const skillsList = profile?.skills || []

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #831843 0%, #be185d 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(131, 24, 67, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <div className="flex" style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.18)', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
              <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} /> CANDIDATE PROFILE
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, margin: '0 0 8px 0', color: '#fff' }}>Master Candidate Profile</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#fbcfe8', lineHeight: 1.5 }}>
            Keep your personal, academic, and resume details up-to-date for automatic eligibility matching.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
        
        {/* Left Column: Form Details */}
        <div className="stack" style={{ gap: 20 }}>
          
          {/* Personal & Contact Details */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex mb-4" style={{ gap: 10, alignItems: 'center' }}>
              <div style={{ padding: 8, background: '#fce7f3', color: '#be185d', borderRadius: 8 }}>
                <UserCheck size={18} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Personal Details</h3>
            </div>

            <form onSubmit={saveProfile} className="stack" style={{ gap: 16 }}>
              <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div className="field mb-0">
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Full Name *</label>
                  <input className="input" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="field mb-0">
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Phone Number *</label>
                  <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
                </div>
              </div>

              <div className="field mb-0">
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Email Address (Account ID)</label>
                <input className="input" value={profile?.email || user?.email} disabled style={{ background: '#f8fafc', color: '#64748b' }} />
              </div>

              <div className="field mb-0">
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>College / University Name *</label>
                <input className="input" name="college_name" value={form.college_name} onChange={handleChange} required placeholder="e.g. Stanford University" />
              </div>

              <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div className="field mb-0">
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Degree</label>
                  <input className="input" name="degree" value={form.degree} onChange={handleChange} placeholder="e.g. B.Tech / M.S." />
                </div>
                <div className="field mb-0">
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Branch / Major</label>
                  <input className="input" name="branch" value={form.branch} onChange={handleChange} placeholder="e.g. Computer Science" />
                </div>
                <div className="field mb-0">
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Graduation Year</label>
                  <input className="input" name="graduation_year" value={form.graduation_year} onChange={handleChange} placeholder="e.g. 2026" />
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 16, marginTop: 4 }}>
                <div className="flex mb-3" style={{ gap: 8, alignItems: 'center' }}>
                  <GraduationCap size={16} color="#be185d" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Academic Scores & Backlogs</span>
                </div>

                <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                  <div className="field mb-0">
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>CGPA (0-10)</label>
                    <input className="input" type="number" step="0.1" name="cgpa" value={form.cgpa} onChange={handleChange} placeholder="8.5" min="0" max="10" />
                  </div>
                  <div className="field mb-0">
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>10th %</label>
                    <input className="input" type="number" step="0.1" name="tenth_pct" value={form.tenth_pct} onChange={handleChange} placeholder="85.0" min="0" max="100" />
                  </div>
                  <div className="field mb-0">
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>12th %</label>
                    <input className="input" type="number" step="0.1" name="twelfth_pct" value={form.twelfth_pct} onChange={handleChange} placeholder="80.0" min="0" max="100" />
                  </div>
                  <div className="field mb-0">
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>Active Backlogs</label>
                    <input className="input" type="number" name="backlogs" value={form.backlogs} onChange={handleChange} placeholder="0" min="0" />
                  </div>
                </div>
              </div>

              <div className="field mb-0">
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Key Skills (Comma Separated)</label>
                <input className="input" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Python, SQL, Machine Learning, React" />
              </div>

              <button className="btn-primary flex" style={{ justifyContent: 'center', gap: 8, height: 42, background: '#be185d', borderColor: '#be185d', marginTop: 8 }} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving Changes…' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Photo & Resume Uploads */}
        <div className="stack" style={{ gap: 20 }}>
          
          {/* Profile Picture Card */}
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Profile Picture</h3>
            
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
              <Avatar 
                name={profile?.name} 
                src={profile?.profile_image ? `${baseURL}/files/${profile.profile_image}` : null} 
                size={120} 
              />
              <label style={{ 
                position: 'absolute', bottom: 0, right: 0, 
                background: '#be185d', color: '#fff', padding: 8, 
                borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' 
              }}>
                <Camera size={16} />
                <input type="file" hidden accept="image/*" onChange={onSelectFile} />
              </label>
            </div>

            <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
              Upload a professional photo. Crop & preview before saving to your profile.
            </p>
          </div>

          {/* Resume Upload Card */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex mb-4" style={{ gap: 10, alignItems: 'center' }}>
              <div style={{ padding: 8, background: '#fce7f3', color: '#be185d', borderRadius: 8 }}>
                <FileText size={18} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Resume Document</h3>
            </div>

            <p className="muted mb-4" style={{ fontSize: 13, lineHeight: 1.5 }}>
              Upload your latest resume (PDF or TXT). Our automated parser extracts your skills & experience for screening.
            </p>

            {profile?.resume_file ? (
              <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 16 }}>
                <div className="flex" style={{ gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <FileText size={20} color="#be185d" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.resume_file.split('/').pop()}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Current Resume Attached</div>
                  </div>
                </div>

                <a 
                  className="btn-soft btn-sm flex" 
                  style={{ justifyContent: 'center', gap: 6, width: '100%', textDecoration: 'none' }}
                  href={`${baseURL}/files/${profile.resume_file}?token=${localStorage.getItem('hr_token')}`} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  <ExternalLink size={14} /> View Current Resume
                </a>
              </div>
            ) : null}

            <label style={{ 
              cursor: 'pointer', padding: '16px', border: '2px dashed #cbd5e1', 
              borderRadius: 10, background: '#f8fafc', display: 'flex', 
              flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' 
            }}>
              <Upload size={22} color="#be185d" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                {profile?.resume_file ? 'Upload New Resume PDF' : 'Click to Upload Resume'}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Accepts .PDF or .TXT formats</span>
              <input type="file" hidden accept=".pdf,.txt" onChange={handleResumeUpload} />
            </label>
          </div>

          {/* Parsed Skills Badge Overview */}
          {skillsList.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div className="flex mb-3" style={{ gap: 8, alignItems: 'center' }}>
                <Award size={16} color="#be185d" />
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>Extracted Skill Profile</h4>
              </div>

              <div className="flex wrap" style={{ gap: 6 }}>
                {skillsList.map((s) => (
                  <span key={s} style={{ padding: '4px 10px', background: '#fce7f3', color: '#9d174d', fontSize: 11.5, fontWeight: 700, borderRadius: 20 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Cropper Modal */}
      <Modal open={cropModal} onClose={() => setCropModal(false)} title="Crop Profile Picture"
        footer={<>
          <button className="btn-ghost" onClick={() => setCropModal(false)}>Cancel</button>
          <button className="btn-primary" style={{ background: '#be185d', borderColor: '#be185d' }} onClick={handleCropSave}>
            <Crop size={16} style={{ marginRight: 6 }} /> Crop & Save Photo
          </button>
        </>}>
        <div style={{ display: 'flex', justifyContent: 'center', background: '#0f172a', borderRadius: 8, overflow: 'hidden', padding: 10 }}>
          {imgSrc && (
            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
              <img ref={imgRef} alt="Crop" src={imgSrc} style={{ maxHeight: '60vh', maxWidth: '100%' }} onLoad={onImageLoad} />
            </ReactCrop>
          )}
        </div>
      </Modal>
    </div>
  )
}

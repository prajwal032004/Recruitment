import { useState, useRef, useEffect } from 'react'
import { Upload, Camera, Save, Check } from 'lucide-react'
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

  return (
    <div className="fade-in">
      <PageHeader title="My Profile" subtitle="Manage your professional details and resume" />

      <div className="two-col mt-4">
        <div className="stack" style={{ gap: '24px' }}>
          <div className="card card-pad">
            <h3 className="h2 mb-4">Personal Details</h3>
            <form onSubmit={saveProfile} className="stack" style={{ gap: '16px' }}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field mb-0">
                  <label>Full Name</label>
                  <input className="input" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="field mb-0">
                  <label>Phone Number</label>
                  <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
                </div>
              </div>
              <div className="field mb-0">
                <label>College / University</label>
                <input className="input" name="college_name" value={form.college_name} onChange={handleChange} required />
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="field mb-0">
                  <label>Degree</label>
                  <input className="input" name="degree" value={form.degree} onChange={handleChange} placeholder="e.g. B.Tech" />
                </div>
                <div className="field mb-0">
                  <label>Branch</label>
                  <input className="input" name="branch" value={form.branch} onChange={handleChange} placeholder="e.g. CSE" />
                </div>
                <div className="field mb-0">
                  <label>Grad Year</label>
                  <input className="input" name="graduation_year" value={form.graduation_year} onChange={handleChange} placeholder="e.g. 2026" />
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div className="field mb-0">
                  <label>CGPA</label>
                  <input className="input" type="number" step="0.1" name="cgpa" value={form.cgpa} onChange={handleChange} placeholder="e.g. 8.5" min="0" max="10" />
                </div>
                <div className="field mb-0">
                  <label>10th %</label>
                  <input className="input" type="number" step="0.1" name="tenth_pct" value={form.tenth_pct} onChange={handleChange} placeholder="e.g. 85.0" min="0" max="100" />
                </div>
                <div className="field mb-0">
                  <label>12th %</label>
                  <input className="input" type="number" step="0.1" name="twelfth_pct" value={form.twelfth_pct} onChange={handleChange} placeholder="e.g. 80.0" min="0" max="100" />
                </div>
                <div className="field mb-0">
                  <label>Active Backlogs</label>
                  <input className="input" type="number" name="backlogs" value={form.backlogs} onChange={handleChange} />
                </div>
              </div>
              <div className="field mb-0">
                <label>Skills (comma separated)</label>
                <textarea className="input" name="skills" value={form.skills} onChange={handleChange} rows={3} placeholder="React, Node.js, Python..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="stack" style={{ gap: '24px' }}>
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <h3 className="h2 mb-4 text-left" style={{ textAlign: 'left' }}>Profile Picture</h3>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              {profile.profile_image ? (
                <img src={`${baseURL}/files/${profile.profile_image}?token=${localStorage.getItem('hr_token')}`} alt="DP" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
              ) : (
                <Avatar name={profile.name} size={120} style={{ fontSize: '32px' }} />
              )}
              <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--brand-500)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                <Camera size={16} />
                <input type="file" hidden accept="image/*" onChange={onSelectFile} />
              </label>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>Upload a professional headshot for HR to view.</p>
          </div>

          <div className="card card-pad">
            <h3 className="h2 mb-4">Resume Document</h3>
            <p className="muted mb-4" style={{ fontSize: 13, lineHeight: 1.6 }}>Upload your resume and we will fetch and fill your eligibility details automatically (CGPA, etc.). If any fields remain empty, please enter them manually.</p>
            {profile.resume_file ? (
              <div style={{ background: '#fdf3f8', padding: '16px', borderRadius: '4px', border: '1px solid #fae4f0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Check size={20} color="var(--brand-700)" />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: 'var(--brand-700)', fontSize: 14 }}>Resume Uploaded</div>
                  <div style={{ fontSize: 12, color: 'var(--brand-700)', opacity: 0.8 }}>Ready for applications</div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--amber-50)', padding: '16px', borderRadius: '4px', border: '1px solid var(--amber-200)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: 'var(--amber-700)', fontSize: 14 }}>No Resume found</div>
                  <div style={{ fontSize: 12, color: 'var(--amber-700)', opacity: 0.8 }}>Please upload your resume to apply for jobs.</div>
                </div>
              </div>
            )}
            
            <label className="btn-ghost btn-block" style={{ cursor: 'pointer', justifyContent: 'center' }}>
              <Upload size={16} /> {profile.resume_file ? 'Replace Resume (PDF)' : 'Upload Resume (PDF)'}
              <input type="file" hidden accept=".pdf" onChange={handleResumeUpload} />
            </label>
          </div>
        </div>
      </div>

      <Modal open={cropModal} onClose={() => setCropModal(false)} title="Crop Profile Picture" maxWidth={500}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCropModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCropSave}>Save Picture</button>
          </>
        }>
        {imgSrc && (
          <div style={{ textAlign: 'center', background: '#000', padding: 20 }}>
            <ReactCrop crop={crop} onChange={(_, pc) => setCrop(pc)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
              <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '60vh', maxWidth: '100%' }} />
            </ReactCrop>
          </div>
        )}
      </Modal>
    </div>
  )
}

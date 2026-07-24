import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Phone, Briefcase, Building, MapPin, Calendar, Lock, Save, Bell, Shield, CheckCircle2 } from 'lucide-react'
import { apiGet, apiPut } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { LoadingSpinner, ErrorState, PageHeader, Avatar } from '../../components/UI'
import { fmtDate } from '../../utils/helpers'

export default function MyProfile() {
  const { user } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    designation: '',
    department: '',
    location: '',
    password: ''
  })

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet('/employees/me')
      setProfile(data)
      setForm({
        name: data.name || user?.name || '',
        phone: data.phone || '',
        designation: data.designation || '',
        department: data.department || '',
        location: data.location || '',
        password: ''
      })
    } catch (err) {
      setError(err.message || 'Failed to load employee profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await apiPut('/employees/me', form)
      setProfile(res)
      setForm((prev) => ({ ...prev, password: '' }))
      toast.success('Profile details updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={loadProfile} />

  return (
    <div style={{ paddingBottom: '40px' }}>
      <PageHeader
        title="Employee Portal"
        subtitle="Manage your employee details, contact information, and account settings."
        icon={User}
      />

      {/* Profile Overview Card */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #ffffff 0%, var(--surface-2) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Avatar name={profile?.name || user?.name} size={64} style={{ fontSize: '24px' }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>{profile?.name}</h2>
              <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                <CheckCircle2 size={12} style={{ marginRight: 4 }} /> {profile?.status || 'Active'}
              </span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span><strong>Code:</strong> {profile?.employee_code || '—'}</span>
              <span><strong>Email:</strong> {profile?.email || user?.email}</span>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/app/notifications" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
              <Bell size={15} /> Notifications History
            </Link>
            <Link to="/app/policy-assistant" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
              <Shield size={15} /> HR Policy Search
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Details Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '17px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: 'var(--brand-600)' }} /> Personal & Job Details
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} /> Full Name
              </label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="text"
                className="input"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={14} /> Designation / Job Title
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Software Engineer"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={14} /> Department
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Engineering / Product"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} /> Work Location
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Headquarters / Remote"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} /> Change Password (Optional)
              </label>
              <input
                type="password"
                className="input"
                placeholder="Leave blank to keep current password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <button type="submit" className="btn" disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Read-Only Account Summary & Info */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: 'var(--brand-600)' }} /> Account & Employment Info
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> Employee Code</span>
              <strong style={{ color: 'var(--text)' }}>{profile?.employee_code || '—'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Date of Joining</span>
              <strong style={{ color: 'var(--text)' }}>{fmtDate(profile?.date_of_joining)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} /> Account Role</span>
              <strong style={{ color: 'var(--brand-700)' }}>EMPLOYEE</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Profile Created</span>
              <strong style={{ color: 'var(--text)' }}>{fmtDate(profile?.created_at)}</strong>
            </div>
          </div>

          <div style={{ marginTop: 'auto', background: 'var(--surface-2)', padding: '16px', borderRadius: 8, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            💡 <strong>Employee Portal Info:</strong> Update your contact details, designation, or location anytime. If you require changes to your Employee Code or Date of Joining, please contact your HR department.
          </div>
        </div>
      </div>
    </div>
  )
}

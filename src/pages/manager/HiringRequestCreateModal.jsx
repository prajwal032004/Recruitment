import { useState, useEffect } from 'react'
import { X, Upload, Plus, CheckCircle2, AlertCircle, Briefcase, FileText, DollarSign, Calendar, MapPin, Users, Building2 } from 'lucide-react'
import { apiGet, apiPost } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'

export default function HiringRequestCreateModal({ isOpen, open, onClose, onCreated, onSuccess, departmentName, selectedDeptId }) {
  const toast = useToast()

  // Handle visibility gracefully (default to true if rendered conditionally)
  const isVisible = isOpen !== undefined ? isOpen : (open !== undefined ? open : true)

  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({
    title: '',
    department_id: selectedDeptId || '',
    description: '',
    openings: 2,
    priority: 'High',
    experience_min: 3,
    experience_max: 6,
    required_skills: '',
    budget_min: '',
    budget_max: '',
    location: 'Headquarters',
    employment_type: 'Full-time',
    timeline: 'Immediate (30 days)'
  })

  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await apiGet('/manager/departments')
        setDepartments(res || [])
        if (res && res.length > 0 && !form.department_id) {
          setForm(prev => ({ ...prev, department_id: res[0].id }))
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadDepts()
  }, [])

  if (!isVisible) return null

  const setField = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Please enter the Job Title.')
    if (!form.required_skills.trim()) return toast.error('Please enter required skills.')

    setSubmitting(true)
    try {
      let res
      if (file) {
        const formData = new FormData()
        Object.keys(form).forEach(k => formData.append(k, form[k]))
        formData.append('file', file)
        res = await apiPost('/manager/hiring-requests', formData, { headers: { 'Content-Type': undefined } })
      } else {
        res = await apiPost('/manager/hiring-requests', form)
      }
      toast.success(`Hiring Request '${form.title}' submitted successfully!`)
      onCreated && onCreated(res)
      onSuccess && onSuccess(res)
      onClose && onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to submit hiring request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'grid', placeItems: 'center', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <div
        className="card fade-in"
        style={{
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 16,
          background: '#ffffff',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={20} color="var(--brand-500, #c5307b)" /> Create Hiring Request Requisition
            </h2>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Submit position requisition to recruitment HR for candidate sourcing.
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm" style={{ padding: 6, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }} className="stack">
          
          {/* Department Selection & Position Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Target Department *
              </label>
              <select
                className="input"
                required
                value={form.department_id}
                onChange={setField('department_id')}
                style={{ borderRadius: 8, height: 42, fontWeight: 600 }}
              >
                {departments.length > 0 ? (
                  departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code || 'DEPT'})</option>
                  ))
                ) : (
                  <option value="">General Department</option>
                )}
              </select>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Job Position Title *
              </label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Senior Full Stack Engineer"
                value={form.title}
                onChange={setField('title')}
                style={{ borderRadius: 8, height: 42 }}
              />
            </div>
          </div>

          {/* Urgency / Priority & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Urgency / Priority *
              </label>
              <select className="input" value={form.priority} onChange={setField('priority')} style={{ borderRadius: 8, height: 42, fontWeight: 700 }}>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">🔥 Urgent / Immediate</option>
              </select>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Location / Work Type
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Headquarters / Remote"
                value={form.location}
                onChange={setField('location')}
                style={{ borderRadius: 8, height: 42 }}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
              Job Description Details *
            </label>
            <textarea
              className="input"
              rows={3}
              required
              placeholder="Outline responsibilities, key project deliverables, and technical requirements..."
              value={form.description}
              onChange={setField('description')}
              style={{ borderRadius: 8, padding: 10, fontSize: 13.5 }}
            />
          </div>

          {/* Openings, Experience, Skills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14, marginBottom: 16 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Openings (Required) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                className="input"
                required
                value={form.openings}
                onChange={setField('openings')}
                style={{ borderRadius: 8, height: 42 }}
              />
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Min Experience (Yrs)
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                className="input"
                value={form.experience_min}
                onChange={setField('experience_min')}
                style={{ borderRadius: 8, height: 42 }}
              />
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Required Skills *
              </label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. React, Python, AWS, SQL"
                value={form.required_skills}
                onChange={setField('required_skills')}
                style={{ borderRadius: 8, height: 42 }}
              />
            </div>
          </div>

          {/* Salary Budget Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Budget Min (₹ / INR)
              </label>
              <input
                type="number"
                className="input"
                placeholder="600000"
                value={form.budget_min}
                onChange={setField('budget_min')}
                style={{ borderRadius: 8, height: 42 }}
              />
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontWeight: 700, fontSize: 12.5, color: '#334155', display: 'block', marginBottom: 6 }}>
                Budget Max (₹ / INR)
              </label>
              <input
                type="number"
                className="input"
                placeholder="1500000"
                value={form.budget_max}
                onChange={setField('budget_max')}
                style={{ borderRadius: 8, height: 42 }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ borderRadius: 8 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                borderRadius: 8,
                padding: '10px 24px',
                background: 'var(--brand-gradient, linear-gradient(135deg, #c5307b 0%, #9e1f5f 100%))',
                fontWeight: 700
              }}
            >
              {submitting ? 'Submitting Request...' : 'Submit Hiring Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

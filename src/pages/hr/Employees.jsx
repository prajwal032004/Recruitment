import { useState } from 'react'
import { Users, Plus, Upload, Download, Search, CheckCircle2, Clock, XCircle, AlertCircle, FileText, Eye, KeyRound } from 'lucide-react'
import api, { baseURL, apiGet, apiPost, apiPut } from '../../api/client'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState, EmptyState, PageHeader, Modal, Badge, Pagination, Avatar } from '../../components/UI'
import { CredentialsModal } from '../../components/CredentialsModal'
import { useToast } from '../../contexts/ToastContext'

const BLANK = {
  employee_code: '',
  name: '',
  email: '',
  phone: '',
  designation: '',
  department: '',
  location: '',
  date_of_joining: '',
  status: 'Active'
}

export default function Employees() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [desigFilter, setDesigFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const queryStr = `/employees?search=${encodeURIComponent(q)}&department=${encodeURIComponent(deptFilter)}&designation=${encodeURIComponent(desigFilter)}&status=${encodeURIComponent(statusFilter)}&page=${page}`
  const { data, loading, error, refetch } = useFetch(queryStr, [q, deptFilter, desigFilter, statusFilter, page])

  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)

  const [credentials, setCredentials] = useState(null)
  const [showCreds, setShowCreds] = useState(false)
  
  const [importModal, setImportModal] = useState(false)
  const [validation, setValidation] = useState(null)
  const [importFile, setImportFile] = useState(null)
  
  const [detailModal, setDetailModal] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [empHistory, setEmpHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const openAdd = () => {
    setEditId(null)
    setForm(BLANK)
    setAddModal(true)
  }

  const openEdit = (emp) => {
    setEditId(emp.id)
    setForm({
      employee_code: emp.employee_code || '',
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      designation: emp.designation || '',
      department: emp.department || '',
      location: emp.location || '',
      date_of_joining: emp.date_of_joining || '',
      azure_object_id: emp.azure_object_id || '',
      status: emp.status || 'Active'
    })
    setAddModal(true)
  }

  const saveEmployee = async () => {
    if (!form.name || !form.email || !form.employee_code) {
      return toast.error('Employee Code, Name, and Email are required.')
    }
    setBusy(true)
    try {
      if (editId) {
        await apiPut(`/employees/${editId}`, form)
        toast.success('Employee updated')
      } else {
        const res = await apiPost('/employees', form)
        toast.success('Employee added')
        if (res?.credentials || res?.data?.credentials) {
          setCredentials(res?.credentials || res?.data?.credentials)
          setShowCreds(true)
        }
      }
      setAddModal(false)
      setForm(BLANK)
      refetch()
    } catch (e) {
      toast.error(e.message || 'Failed to save employee')
    } finally {
      setBusy(false)
    }
  }

  const runValidate = async (file) => {
    setImportFile(file)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/employees/import/validate', fd, { headers: { 'Content-Type': undefined } })
      setValidation(res.data?.data)
    } catch (e) {
      toast.error(e.message || 'Failed to validate file')
    }
  }

  const commitImport = async () => {
    setBusy(true)
    try {
      const res = await apiPost('/employees/import/commit', {
        valid_rows: validation.valid_rows,
        filename: importFile?.name
      })
      toast.success(res.message || 'Import completed')
      setImportModal(false)
      setValidation(null)
      setImportFile(null)
      refetch()
    } catch (e) {
      toast.error(e.message || 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const openProfile = async (emp) => {
    setSelectedEmp(emp)
    setDetailModal(true)
    setHistoryLoading(true)
    try {
      const res = await apiGet(`/employees/${emp.id}`)
      setSelectedEmp(res)
      setEmpHistory(res.training_history || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load employee details')
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div>
      <CredentialsModal
        open={showCreds}
        onClose={() => setShowCreds(false)}
        credentials={credentials}
      />

      <PageHeader
        title="Employees"
        subtitle="Workforce directory, identity management, and training progression."
        icon={Users}
        actions={
          <div className="flex" style={{ gap: 8 }}>
            <a className="btn-soft btn-sm flex" style={{ gap: 4 }} href={`${baseURL}/templates/employees`}>
              <Download size={14} /> <span>Template</span>
            </a>
            <button className="btn-soft btn-sm flex" style={{ gap: 4 }} onClick={() => setImportModal(true)}>
              <Upload size={14} /> <span>Import</span>
            </button>
            <button className="btn-primary btn-sm flex" style={{ gap: 4 }} onClick={openAdd}>
              <Plus size={14} /> <span>Add Employee</span>
            </button>
          </div>
        }
      />

      {/* Search & Filters */}
      <div className="card flex wrap mb-4" style={{ gap: 12, padding: '16px 20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-3)' }} />
          <input
            className="input"
            style={{ paddingLeft: 40, width: '100%' }}
            placeholder="Search by code, name, email..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
          />
        </div>
        <input
          className="input"
          style={{ width: 160 }}
          placeholder="Filter Dept"
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }}
        />
        <input
          className="input"
          style={{ width: 160 }}
          placeholder="Filter Designation"
          value={desigFilter}
          onChange={(e) => { setDesigFilter(e.target.value); setPage(1) }}
        />
        <select
          className="select"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (data?.items || []).length === 0 ? (
        <EmptyState icon={Users} title="No employees found" message="Add employees manually or bulk-import a CSV/Excel file." />
      ) : (
        <>
          <div className="card mt-4" style={{ padding: 0 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee</th>
                  <th>Designation / Dept</th>
                  <th>Location</th>
                  <th>DOJ</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <span className="chip" style={{ fontWeight: 700 }}>{emp.employee_code}</span>
                    </td>
                    <td>
                      <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
                        <Avatar name={emp.name} size={36} />
                        <div>
                          <strong style={{ color: 'var(--text)' }}>{emp.name}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{emp.designation || '—'}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{emp.department || '—'}</div>
                    </td>
                    <td>{emp.location || '—'}</td>
                    <td>{emp.date_of_joining || '—'}</td>
                    <td>
                      <Badge variant={emp.status === 'Active' ? 'badge-green' : 'badge-amber'}>
                        {emp.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn-soft btn-sm flex"
                          style={{ gap: 4, color: 'var(--brand-600)', background: 'var(--brand-50)' }}
                          title="Share Login Credentials"
                          onClick={async () => {
                            try {
                              const res = await apiGet(`/employees/${emp.id}/credentials`)
                              setCredentials(res)
                              setShowCreds(true)
                            } catch (e) {
                              toast.error('Failed to load credentials')
                            }
                          }}
                        >
                          <KeyRound size={13} /> <span>Credentials</span>
                        </button>
                        <button className="btn-ghost btn-sm" title="View Training History" onClick={() => openProfile(emp)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-soft btn-sm" onClick={() => openEdit(emp)}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={data?.total || 0} perPage={data?.per_page || 15} onPage={setPage} />
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title={editId ? 'Edit Employee' : 'Add Employee'}
        footer={
          <>
            <button className="btn-ghost btn-sm" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={saveEmployee} disabled={busy}>
              {busy ? 'Saving...' : editId ? 'Update Employee' : 'Save Employee'}
            </button>
          </>
        }
      >
        <div className="stack mb-3" style={{ gap: 12 }}>
          <div className="flex" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Employee Code *</label>
              <input className="input" value={form.employee_code} onChange={set('employee_code')} placeholder="EMP1001" disabled={!!editId} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Full Name *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="John Doe" />
            </div>
          </div>

          <div className="flex" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Email *</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" disabled={!!editId} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
            </div>
          </div>

          <div className="flex" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Designation</label>
              <input className="input" value={form.designation} onChange={set('designation')} placeholder="Software Engineer" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Department</label>
              <input className="input" value={form.department} onChange={set('department')} placeholder="Engineering" />
            </div>
          </div>

          <div className="flex" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Location</label>
              <input className="input" value={form.location} onChange={set('location')} placeholder="Bengaluru" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Date of Joining</label>
              <input className="input" type="date" value={form.date_of_joining} onChange={set('date_of_joining')} />
            </div>
          </div>

          <div className="field">
            <label>Status</label>
            <select className="select" value={form.status} onChange={set('status')}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        open={importModal}
        onClose={() => { setImportModal(false); setValidation(null) }}
        title="Import Employees"
        width={560}
        footer={
          validation?.valid ? (
            <>
              <button className="btn-ghost" onClick={() => setValidation(null)}>Back</button>
              <button className="btn-primary" onClick={commitImport} disabled={busy}>
                {busy ? 'Importing…' : `Import ${validation.valid_rows.length} Employees`}
              </button>
            </>
          ) : null
        }
      >
        {!validation ? (
          <div>
            <p className="muted mb-4">
              Upload a CSV or Excel file containing employee records. Required columns: <code>employee_code, name, email</code>. Optional columns: <code>phone, designation, department, location, date_of_joining, azure_object_id, status</code>.
            </p>
            <label className="btn-soft btn-block" style={{ cursor: 'pointer', textAlign: 'center', padding: '14px' }}>
              <Upload size={16} style={{ display: 'inline', marginRight: 6 }} /> Choose File (.csv, .xlsx)
              <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files[0] && runValidate(e.target.files[0])} />
            </label>
          </div>
        ) : (
          <div>
            <p className="mb-4">{validation.message}</p>
            <div className="flex mb-4" style={{ gap: 10 }}>
              <Badge variant="badge-green">{validation.valid_rows.length} Valid Rows</Badge>
              <Badge variant="badge-red">{validation.invalid_rows.length} Invalid Rows</Badge>
            </div>
            {validation.invalid_rows.length > 0 && (
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                <table className="data">
                  <thead>
                    <tr><th>Row</th><th>Error</th></tr>
                  </thead>
                  <tbody>
                    {validation.invalid_rows.map((e, i) => (
                      <tr key={i}>
                        <td>{e.row}</td>
                        <td className="muted">{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Employee Profile & Training History Modal */}
      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title={selectedEmp ? `${selectedEmp.name} — Profile & Training History` : "Employee Details"}
        width={720}
        footer={<button className="btn-ghost" onClick={() => setDetailModal(false)}>Close</button>}
      >
        {selectedEmp && (
          <div>
            {/* Quick Profile Summary */}
            <div className="card mb-4" style={{ background: 'var(--surface-2)', padding: '16px' }}>
              <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Employee Code</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedEmp.employee_code}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Designation & Dept</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedEmp.designation || 'N/A'} • {selectedEmp.department || 'N/A'}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Location & DOJ</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedEmp.location || 'N/A'} ({selectedEmp.date_of_joining || 'N/A'})</div>
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', marginBottom: 12 }}>
              Assigned Trainings ({empHistory.length})
            </h4>

            {historyLoading ? (
              <LoadingSpinner />
            ) : empHistory.length === 0 ? (
              <div className="muted" style={{ padding: '20px', textAlign: 'center', background: 'var(--surface-2)', borderRadius: 8 }}>
                No training courses assigned to this employee yet.
              </div>
            ) : (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Course Title</th>
                      <th>Cycle</th>
                      <th>Assigned / Due</th>
                      <th>Video Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empHistory.map((item) => {
                      const isCompleted = item.status === 'Completed'
                      const isOverdue = item.status === 'Overdue'
                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.course_title}</strong>
                            <div className="muted" style={{ fontSize: 11 }}>{item.course_category}</div>
                          </td>
                          <td><span className="chip" style={{ fontSize: 11 }}>{item.cycle}</span></td>
                          <td>
                            <div style={{ fontSize: 12 }}>Assigned: {item.assigned_on ? item.assigned_on.slice(0, 10) : '—'}</div>
                            <div className="muted" style={{ fontSize: 11 }}>Due: {item.due_date ? item.due_date.slice(0, 10) : '—'}</div>
                          </td>
                          <td>
                            <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
                              <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${item.watched_percent || 0}%`, background: 'var(--brand-500)' }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700 }}>{Math.round(item.watched_percent || 0)}%</span>
                            </div>
                          </td>
                          <td>
                            <Badge variant={isCompleted ? 'badge-green' : isOverdue ? 'badge-red' : 'badge-blue'}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

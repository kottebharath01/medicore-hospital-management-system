import React, { useState, useEffect, useCallback } from 'react';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  resetDoctorPassword,
  getDepartments,
} from '../utils/api';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Stethoscope,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Oncology',
  'Gynecology',
  'Ophthalmology',
  'ENT',
  'General Medicine',
  'Psychiatry',
  'Radiology',
  'Urology',
  'Nephrology',
  'Gastroenterology',
];

const EMPTY = {
  name: '',
  username: '',
  password: '',
  confirm_password: '',
  specialization: 'Cardiology',
  department_id: '',
  phone: '',
  email: '',
  experience: '',
  fee: '500',
  available: true,
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Success summary modal after new account creation
  const [createdSummary, setCreatedSummary] = useState(null);

  // Admin password reset modal
  const [resetModal, setResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetForm, setResetForm] = useState({ new_password: '', confirm_password: '' });
  const [resetting, setResetting] = useState(false);

  const currentUser = (() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();
  const isAdmin = currentUser?.role === 'admin';

  const load = useCallback(() => {
    setLoading(true);
    getDoctors(q, deptFilter)
      .then((r) => {
        setDoctors(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [q, deptFilter]);

  useEffect(() => {
    getDepartments()
      .then((r) => setDepartments(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function openAdd() {
    setForm({
      ...EMPTY,
      department_id: departments[0]?.id ? String(departments[0].id) : '',
    });
    setEditing(null);
    setModal(true);
  }

  function openEdit(d) {
    setForm({
      name: d.name,
      username: d.username || '',
      password: '',
      confirm_password: '',
      specialization: d.specialization || 'Cardiology',
      department_id: d.department_id ? String(d.department_id) : '',
      phone: d.phone || '',
      email: d.email || '',
      experience: d.experience ?? '',
      fee: d.fee ?? 500,
      available: d.available ?? true,
    });
    setEditing(d.id);
    setModal(true);
  }

  function openResetPassword(d) {
    setResetTarget(d);
    setResetForm({ new_password: '', confirm_password: '' });
    setResetModal(true);
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) return toast.error('Doctor name is required');
    if (!form.specialization) return toast.error('Specialization is required');

    // Validation for new doctor registration
    if (!editing) {
      if (!form.username.trim()) {
        return toast.error('Username is required for the doctor login account');
      }
      if (form.username.trim().length < 3) {
        return toast.error('Username must be at least 3 characters long');
      }
      if (!form.password) {
        return toast.error('Initial password is required');
      }
      if (form.password.length < 6) {
        return toast.error('Password must be at least 6 characters long');
      }
      if (form.password !== form.confirm_password) {
        return toast.error('Password and confirm password do not match');
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        specialization: form.specialization,
        department_id: form.department_id ? parseInt(form.department_id, 10) : null,
        phone: form.phone.trim(),
        email: form.email.trim(),
        experience: form.experience ? parseInt(form.experience, 10) : 0,
        fee: form.fee ? parseFloat(form.fee) : 500.0,
        available: Boolean(form.available),
      };

      if (editing) {
        await updateDoctor(editing, payload);
        toast.success('Doctor details updated');
        setModal(false);
      } else {
        const res = await createDoctor(payload);
        toast.success('Doctor and login account created successfully');
        setModal(false);
        // Display credentials confirmation modal
        if (res.data?.credentials) {
          setCreatedSummary(res.data.credentials);
        }
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving doctor');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetForm.new_password) {
      return toast.error('New password is required');
    }
    if (resetForm.new_password.length < 6) {
      return toast.error('New password must be at least 6 characters long');
    }
    if (resetForm.new_password !== resetForm.confirm_password) {
      return toast.error('Passwords do not match');
    }

    setResetting(true);
    try {
      const res = await resetDoctorPassword(resetTarget.id, resetForm);
      toast.success(res.data?.message || 'Password reset successfully');
      setResetModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }

  async function toggleAvailability(d) {
    if (!isAdmin) return;
    try {
      await updateDoctor(d.id, { available: !d.available });
      toast.success(`Dr. ${d.name} marked as ${!d.available ? 'Available' : 'Busy'}`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function del(d) {
    if (!window.confirm(`Are you sure you want to remove Dr. ${d.name} and delete their login account?`)) return;
    try {
      await deleteDoctor(d.id);
      toast.success('Doctor account removed successfully');
      load();
    } catch {
      toast.error('Failed to remove doctor');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Medical Doctors</h2>
          <p>{doctors.length} qualified specialists on medical staff</p>
        </div>
        <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search className="search-icon" size={15} />
            <input
              placeholder="Search doctor, code, specialization…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 180 }}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.name}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={15} /> Add Doctor
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Loading doctors…</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="empty-state">
              <Stethoscope size={48} />
              <h3>No doctors found</h3>
              <p>Try adjusting your search criteria or register a new doctor.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Doctor ID</th>
                  <th>Doctor Name</th>
                  <th>Username</th>
                  <th>Department / Specialization</th>
                  <th>Experience</th>
                  <th>Consultation Fee</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="badge badge-blue">{d.code || `DOC-${String(d.id).padStart(4, '0')}`}</span>
                    </td>
                    <td>
                      <span className="fw-600">
                        {d.name?.toLowerCase().startsWith('dr.') ? d.name : `Dr. ${d.name}`}
                      </span>
                    </td>
                    <td>
                      {d.username ? (
                        <span className="badge badge-scheduled" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          @{d.username}
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <span className="badge badge-blue">{d.specialization}</span>
                        {d.department_name && d.department_name !== d.specialization && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Dept: {d.department_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{d.experience ? `${d.experience} yrs` : '—'}</td>
                    <td>
                      <strong>{d.fee ? `₹${Number(d.fee).toLocaleString('en-IN')}` : '—'}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{d.phone || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.email || ''}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleAvailability(d)}
                        disabled={!isAdmin}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isAdmin ? 'pointer' : 'default',
                          padding: 0,
                        }}
                      >
                        <span
                          className={`badge ${d.available ? 'badge-available' : 'badge-busy'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {d.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {d.available ? 'Available' : 'Busy'}
                        </span>
                      </button>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex gap-8">
                          <button className="btn-icon" title="Edit Doctor" onClick={() => openEdit(d)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Reset Doctor Login Password"
                            style={{ color: 'var(--primary)' }}
                            onClick={() => openResetPassword(d)}
                          >
                            <KeyRound size={14} />
                          </button>
                          <button className="btn-icon danger" title="Remove Doctor" onClick={() => del(d)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Doctor Modal */}
      {modal && (
        <Modal
          title={editing ? 'Edit Doctor Profile' : 'Register Doctor & Create Account'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Doctor' : 'Create Doctor Account'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div
                style={{
                  background: 'var(--primary-light, #eef4f9)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.84rem',
                  color: 'var(--primary, #0f4c81)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ShieldCheck size={18} />
                <span>
                  Admin enters the Doctor's <strong>Username</strong> and <strong>Initial Password</strong>.
                  The system automatically assigns the unique <strong>Doctor ID (DOC-xxxx)</strong>.
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Doctor Full Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Dr. Ravi Kumar"
              />
            </div>

            {!editing && (
              <>
                <div className="form-group">
                  <label className="form-label">Username * (For Staff Login)</label>
                  <input
                    className="form-control"
                    value={form.username}
                    onChange={(e) => setField('username', e.target.value)}
                    placeholder="e.g. Doctor_ravi"
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password *</label>
                  <input
                    className="form-control"
                    type="password"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    className="form-control"
                    type="password"
                    value={form.confirm_password}
                    onChange={(e) => setField('confirm_password', e.target.value)}
                    placeholder="Repeat initial password"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Clinical Specialization *</label>
              <select
                className="form-control"
                value={form.specialization}
                onChange={(e) => setField('specialization', e.target.value)}
              >
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hospital Department</label>
              <select
                className="form-control"
                value={form.department_id}
                onChange={(e) => setField('department_id', e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.experience}
                onChange={(e) => setField('experience', e.target.value)}
                placeholder="e.g. 10"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.fee}
                onChange={(e) => setField('fee', e.target.value)}
                placeholder="e.g. 800"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="e.g. +91 98765 43210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="doctor@hospital.com (Optional)"
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setField('available', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span className="form-label" style={{ margin: 0 }}>
                  Available for Consultations
                </span>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Reset Password Modal */}
      {resetModal && resetTarget && (
        <Modal
          title={`Reset Password for Dr. ${resetTarget.name}`}
          onClose={() => setResetModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setResetModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting}>
                {resetting ? 'Resetting…' : 'Update Password'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem' }}>
              <div><strong>Doctor:</strong> Dr. {resetTarget.name}</div>
              <div><strong>Staff ID:</strong> {resetTarget.code || `DOC-${resetTarget.id}`}</div>
              {resetTarget.username && <div><strong>Username:</strong> @{resetTarget.username}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                className="form-control"
                type="password"
                value={resetForm.new_password}
                onChange={(e) => setResetForm((f) => ({ ...f, new_password: e.target.value }))}
                placeholder="Enter at least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                className="form-control"
                type="password"
                value={resetForm.confirm_password}
                onChange={(e) => setResetForm((f) => ({ ...f, confirm_password: e.target.value }))}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Account Created Success Confirmation Modal */}
      {createdSummary && (
        <Modal
          title="Doctor Account Created Successfully"
          onClose={() => setCreatedSummary(null)}
          footer={
            <button className="btn btn-primary" onClick={() => setCreatedSummary(null)}>
              Done
            </button>
          }
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#e6f7f5',
                color: '#00a99d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <UserCheck size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Staff Profile & Login Ready</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              The doctor's profile and authentication account were created in the database.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '16px 20px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Doctor Name:</span>
                <strong>{createdSummary.name?.toLowerCase().startsWith('dr.') ? createdSummary.name : `Dr. ${createdSummary.name}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Doctor ID:</span>
                <span className="badge badge-blue">{createdSummary.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Assigned Username:</span>
                <span className="badge badge-scheduled">@{createdSummary.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">System Role:</span>
                <span className="badge badge-available">Doctor</span>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                background: '#f0fdf4',
                color: '#166534',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.82rem',
                textAlign: 'left',
              }}
            >
              The doctor can now sign in at the login screen using their <strong>Username</strong> and the initial password set by Admin.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

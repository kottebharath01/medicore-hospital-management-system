import React, { useState, useEffect, useCallback } from 'react';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  resetStaffPassword,
  getDepartments,
} from '../utils/api';
import Modal from '../components/Modal';
import {
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Search,
  ShieldCheck,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '',
  username: '',
  password: '',
  confirm_password: '',
  role: 'Nurse',
  department_id: '',
  phone: '',
  email: '',
  shift: 'Morning',
};

const ROLES = ['Nurse', 'Receptionist'];

const SHIFTS = ['Morning', 'Evening', 'Night', 'Rotating'];

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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
    getStaff()
      .then((r) => {
        setStaff(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    getDepartments()
      .then((r) => setDepartments(r.data || []))
      .catch(() => {});
  }, [load]);

  function openAdd() {
    setForm({
      ...EMPTY,
      department_id: departments[0]?.id ? String(departments[0].id) : '',
    });
    setEditing(null);
    setModal(true);
  }

  function openEdit(s) {
    setForm({
      name: s.name,
      username: s.username || '',
      password: '',
      confirm_password: '',
      role: s.role || 'Nurse',
      department_id: s.department_id ? String(s.department_id) : '',
      phone: s.phone || '',
      email: s.email || '',
      shift: s.shift || 'Morning',
    });
    setEditing(s.id);
    setModal(true);
  }

  function openResetPassword(s) {
    setResetTarget(s);
    setResetForm({ new_password: '', confirm_password: '' });
    setResetModal(true);
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim() || !form.role) return toast.error('Name and role are required');

    // Validation for new staff member registration
    if (!editing) {
      if (!form.username.trim()) {
        return toast.error('Username is required for the staff login account');
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
      const selectedDept = departments.find((d) => String(d.id) === String(form.department_id));
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        role: form.role,
        department_id: form.department_id ? parseInt(form.department_id, 10) : null,
        department: selectedDept ? selectedDept.name : form.department || 'General',
        phone: form.phone.trim(),
        email: form.email.trim(),
        shift: form.shift,
      };

      if (editing) {
        await updateStaff(editing, payload);
        toast.success('Staff details updated');
        setModal(false);
      } else {
        const res = await createStaff(payload);
        toast.success('Staff member and login credentials created successfully');
        setModal(false);
        if (res.data?.credentials) {
          setCreatedSummary(res.data.credentials);
        }
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving staff member');
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
      const res = await resetStaffPassword(resetTarget.id, resetForm);
      toast.success(res.data?.message || 'Password reset successfully');
      setResetModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  }

  async function del(s) {
    if (!window.confirm(`Remove staff member ${s.name} and delete their login account?`)) return;
    try {
      await deleteStaff(s.id);
      toast.success('Staff removed successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove staff');
    }
  }

  const shiftColor = {
    Morning: 'badge-green',
    Evening: 'badge-amber',
    Night: 'badge-blue',
    Rotating: 'badge-scheduled',
  };

  const filteredStaff = staff.filter((s) => {
    if (roleFilter && s.role !== roleFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.role && s.role.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Staff Members</h2>
          <p>{staff.length} healthcare and administrative personnel</p>
        </div>
        <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search className="search-icon" size={15} />
            <input
              placeholder="Search name, code, username, role…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 170 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={15} /> Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Loading staff…</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="empty-state">
              <UserCog size={48} />
              <h3>No staff records found</h3>
              <p>Adjust your search criteria or register new staff members.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Staff Code</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Shift</th>
                  <th>Phone</th>
                  <th>Email</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="badge badge-blue">
                        {s.code || (s.role.toLowerCase().includes('nurse') ? `NUR-${String(s.id).padStart(4, '0')}` : `REC-${String(s.id).padStart(4, '0')}`)}
                      </span>
                    </td>
                    <td>
                      <span className="fw-600">{s.name}</span>
                    </td>
                    <td>
                      {s.username ? (
                        <span className="badge badge-scheduled" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          @{s.username}
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-blue">{s.role}</span>
                    </td>
                    <td>{s.department || '—'}</td>
                    <td>
                      <span className={`badge ${shiftColor[s.shift] || 'badge-scheduled'}`}>{s.shift || '—'}</span>
                    </td>
                    <td>{s.phone || '—'}</td>
                    <td>
                      <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                        {s.email || '—'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex gap-8">
                          <button className="btn-icon" title="Edit Staff" onClick={() => openEdit(s)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Reset Staff Login Password"
                            style={{ color: 'var(--primary)' }}
                            onClick={() => openResetPassword(s)}
                          >
                            <KeyRound size={14} />
                          </button>
                          <button className="btn-icon danger" title="Remove Staff" onClick={() => del(s)}>
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

      {/* Add / Edit Staff Modal */}
      {modal && (
        <Modal
          title={editing ? 'Edit Staff Member' : 'Register Staff & Create Account'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Staff' : 'Create Staff Account'}
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
                  Admin enters the Staff member's <strong>Username</strong> and <strong>Initial Password</strong>.
                  The system automatically assigns the unique <strong>Staff ID (NUR-xxxx for Nurse, REC-xxxx for Receptionist)</strong>.
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Maria Gonzalez"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role / Designation *</label>
              <select className="form-control" value={form.role} onChange={(e) => setField('role', e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {!editing && (
              <>
                <div className="form-group">
                  <label className="form-label">Username * (For Staff Login)</label>
                  <input
                    className="form-control"
                    value={form.username}
                    onChange={(e) => setField('username', e.target.value)}
                    placeholder="e.g. Nurse_maria"
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
              <label className="form-label">Hospital Department</label>
              <select
                className="form-control"
                value={form.department_id}
                onChange={(e) => setField('department_id', e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duty Shift</label>
              <select
                className="form-control"
                value={form.shift}
                onChange={(e) => setField('shift', e.target.value)}
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="staff@hospital.com (Optional)"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Reset Password Modal */}
      {resetModal && resetTarget && (
        <Modal
          title={`Reset Password for ${resetTarget.name}`}
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
              <div><strong>Staff Member:</strong> {resetTarget.name}</div>
              <div><strong>Staff ID:</strong> {resetTarget.code}</div>
              <div><strong>Role:</strong> {resetTarget.role}</div>
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
          title="Staff Account Created Successfully"
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
              The staff profile and authentication account have been registered in the database.
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
                <span className="text-muted">Staff Name:</span>
                <strong>{createdSummary.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Staff ID:</span>
                <span className="badge badge-blue">{createdSummary.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Assigned Username:</span>
                <span className="badge badge-scheduled">@{createdSummary.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">System Role:</span>
                <span className="badge badge-available" style={{ textTransform: 'capitalize' }}>
                  {createdSummary.role}
                </span>
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
              The staff member can now sign in at the login screen using their <strong>Username</strong> and the initial password set by Admin.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

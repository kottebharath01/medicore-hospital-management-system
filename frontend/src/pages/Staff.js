import React, { useState, useEffect, useCallback } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff, getDepartments } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, UserCog, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '',
  role: 'Nurse',
  department_id: '',
  phone: '',
  email: '',
  shift: 'Morning',
};

const ROLES = [
  'Head Nurse',
  'Nurse',
  'Lab Technician',
  'Pharmacist',
  'Receptionist',
  'Radiologist',
  'Physiotherapist',
  'Ward Attendant',
  'Cleaner',
  'Security Officer',
];

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
      role: s.role || 'Nurse',
      department_id: s.department_id ? String(s.department_id) : '',
      phone: s.phone || '',
      email: s.email || '',
      shift: s.shift || 'Morning',
    });
    setEditing(s.id);
    setModal(true);
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim() || !form.role) return toast.error('Name and role are required');
    setSaving(true);
    try {
      const selectedDept = departments.find((d) => String(d.id) === String(form.department_id));
      const payload = {
        ...form,
        department_id: form.department_id ? parseInt(form.department_id, 10) : null,
        department: selectedDept ? selectedDept.name : form.department || 'General',
      };

      if (editing) {
        await updateStaff(editing, payload);
        toast.success('Staff details updated');
      } else {
        await createStaff(payload);
        toast.success('Staff member registered');
      }
      load();
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving staff member');
    } finally {
      setSaving(false);
    }
  }

  async function del(s) {
    if (!window.confirm(`Remove staff member ${s.name}?`)) return;
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
              placeholder="Search name, code, department…"
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
                        {s.code || (s.role.toLowerCase().includes('nurse') ? `NUR-${s.id}` : `STF-${s.id}`)}
                      </span>
                    </td>
                    <td>
                      <span className="fw-600">{s.name}</span>
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

      {modal && (
        <Modal
          title={editing ? 'Edit Staff Member' : 'Register New Staff Member'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Staff' : 'Add Staff'}
              </button>
            </>
          }
        >
          <div className="form-grid">
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
                placeholder="staff@hospital.com"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor, getDepartments } from '../utils/api';
import Modal from '../components/Modal';
import { Search, Plus, Pencil, Trash2, Stethoscope, CheckCircle2, XCircle } from 'lucide-react';
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

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) return toast.error('Doctor name is required');
    if (!form.specialization) return toast.error('Specialization is required');

    setSaving(true);
    try {
      const payload = {
        ...form,
        department_id: form.department_id ? parseInt(form.department_id, 10) : null,
        experience: form.experience ? parseInt(form.experience, 10) : 0,
        fee: form.fee ? parseFloat(form.fee) : 500.0,
      };

      if (editing) {
        await updateDoctor(editing, payload);
        toast.success('Doctor details updated');
      } else {
        await createDoctor(payload);
        toast.success('Doctor registered successfully');
      }
      load();
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving doctor');
    } finally {
      setSaving(false);
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
    if (!window.confirm(`Are you sure you want to remove Dr. ${d.name}?`)) return;
    try {
      await deleteDoctor(d.id);
      toast.success('Doctor removed');
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
                      <span className="fw-600">Dr. {d.name}</span>
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

      {modal && (
        <Modal
          title={editing ? 'Edit Doctor Profile' : 'Register New Doctor'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Doctor' : 'Register Doctor'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Doctor Full Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Sarah Jenkins"
              />
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
                placeholder="doctor@hospital.com"
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
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getDepartments, createDepartment } from '../utils/api';
import Modal from '../components/Modal';
import { Building2, Plus, Stethoscope, Users, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';

  const load = () => {
    setLoading(true);
    getDepartments()
      .then((r) => {
        setDepartments(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name) return toast.error('Department name is required');
    setSaving(true);
    try {
      await createDepartment(form);
      toast.success('Department created');
      setModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Hospital Clinical Departments</h2>
          <p>Database-tracked department specialties, doctor rosters, and assigned nursing staff</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={15} /> Add Department
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Loading departments…</span>
        </div>
      ) : departments.length === 0 ? (
        <div className="card empty-state">
          <Building2 size={48} color="var(--text-muted)" />
          <h3>No departments registered</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {departments.map((d) => (
            <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-blue">{d.code || `DEP-${String(d.id).padStart(4, '0')}`}</span>
                  <HeartPulse size={18} color="var(--primary-color)" />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '6px 0', color: 'var(--text-color)' }}>
                  {d.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minHeight: 36, marginBottom: 14 }}>
                  {d.description || 'Specialized clinical care and patient consultation services.'}
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Stethoscope size={13} /> Doctors
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    {d.doctors_count}
                  </span>
                </div>
                <div style={{ width: 1, background: '#cbd5e1' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Users size={13} /> Nurses / Staff
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)' }}>
                    {d.staff_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title="Add New Clinical Department"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create Department'}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input
                required
                className="form-control"
                placeholder="e.g. Ophthalmology"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Brief summary of department services"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

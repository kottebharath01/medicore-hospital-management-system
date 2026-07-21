import React, { useState, useEffect, useCallback } from 'react';
import { getPatients, createPatient, updatePatient, deletePatient } from '../utils/api';
import Modal from '../components/Modal';
import { Search, Plus, Pencil, Trash2, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', age:'', gender:'Male', blood_group:'', phone:'', email:'', address:'' };
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState('');
  const [modal, setModal]       = useState(null);  // null | 'add' | 'edit'
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getPatients(q).then(r => { setPatients(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [q]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  function openAdd()    { setForm(EMPTY); setEditing(null); setModal('form'); }
  function openEdit(p)  { setForm({...p}); setEditing(p.id); setModal('form'); }
  function closeModal() { setModal(null); }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.name || !form.age || !form.gender) return toast.error('Name, age and gender are required');
    setSaving(true);
    try {
      if (editing) {
        await updatePatient(editing, form);
        toast.success('Patient updated');
      } else {
        await createPatient(form);
        toast.success('Patient added');
      }
      load(); closeModal();
    } catch { toast.error('Something went wrong'); }
    setSaving(false);
  }

  async function del(p) {
    if (!window.confirm(`Remove patient ${p.name}?`)) return;
    await deletePatient(p.id);
    toast.success('Patient removed');
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><h2>Patients</h2><p>{patients.length} registered</p></div>
        <div className="flex gap-12">
          <div className="search-bar">
            <Search className="search-icon" size={15} />
            <input placeholder="Search patients…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Patient</button>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading
            ? <div className="loading-spinner"><div className="spinner"/><span>Loading…</span></div>
            : patients.length === 0
            ? <div className="empty-state"><UserX size={48}/><h3>No patients found</h3><p>Add a patient to get started.</p></div>
            : <table>
                <thead><tr>
                  <th>ID</th><th>Name</th><th>Age</th><th>Gender</th>
                  <th>Blood Group</th><th>Phone</th><th>Email</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id}>
                      <td><span className="text-muted">#{p.id}</span></td>
                      <td><span className="fw-600">{p.name}</span></td>
                      <td>{p.age} yrs</td>
                      <td><span className={`badge ${p.gender==='Male' ? 'badge-blue' : 'badge-scheduled'}`}>{p.gender}</span></td>
                      <td><span className="badge badge-red">{p.blood_group || '—'}</span></td>
                      <td>{p.phone || '—'}</td>
                      <td>{p.email || '—'}</td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn-icon" onClick={() => openEdit(p)}><Pencil size={14}/></button>
                          <button className="btn-icon danger" onClick={() => del(p)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {modal === 'form' && (
        <Modal
          title={editing ? 'Edit Patient' : 'Add New Patient'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Add Patient'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Patient name" />
            </div>
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input className="form-control" type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="Age in years" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-control" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
          </div>
        </Modal>
      )}
    </div>
  );
}

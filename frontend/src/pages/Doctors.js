import React, { useState, useEffect, useCallback } from 'react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../utils/api';
import Modal from '../components/Modal';
import { Search, Plus, Pencil, Trash2, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'Cardiology','Neurology','Orthopedics','Pediatrics','Dermatology',
  'Oncology','Gynecology','Ophthalmology','ENT','General Medicine',
  'Psychiatry','Radiology','Urology','Nephrology','Gastroenterology'
];

const EMPTY = { name:'', specialization:'Cardiology', phone:'', email:'', experience:'', fee:'', available:true };

export default function Doctors() {
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getDoctors(q).then(r => { setDoctors(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [q]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  function openAdd()   { setForm(EMPTY); setEditing(null); setModal(true); }
  function openEdit(d) { setForm({...d}); setEditing(d.id); setModal(true); }
  function set(k,v)    { setForm(f => ({...f, [k]:v})); }

  async function save() {
    if (!form.name || !form.specialization) return toast.error('Name and specialization required');
    setSaving(true);
    try {
      editing ? await updateDoctor(editing, form) : await createDoctor(form);
      toast.success(editing ? 'Doctor updated' : 'Doctor added');
      load(); setModal(false);
    } catch { toast.error('Error saving doctor'); }
    setSaving(false);
  }

  async function del(d) {
    if (!window.confirm(`Remove Dr. ${d.name}?`)) return;
    await deleteDoctor(d.id);
    toast.success('Doctor removed');
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><h2>Doctors</h2><p>{doctors.length} on staff</p></div>
        <div className="flex gap-12">
          <div className="search-bar">
            <Search className="search-icon" size={15}/>
            <input placeholder="Search name or specialization…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Doctor</button>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading
            ? <div className="loading-spinner"><div className="spinner"/><span>Loading…</span></div>
            : doctors.length === 0
            ? <div className="empty-state"><Stethoscope size={48}/><h3>No doctors found</h3></div>
            : <table>
                <thead><tr>
                  <th>Name</th><th>Specialization</th><th>Experience</th>
                  <th>Consultation Fee</th><th>Phone</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {doctors.map(d => (
                    <tr key={d.id}>
                      <td><span className="fw-600">Dr. {d.name}</span><br/><span className="text-muted">{d.email}</span></td>
                      <td><span className="badge badge-blue">{d.specialization}</span></td>
                      <td>{d.experience ? `${d.experience} yrs` : '—'}</td>
                      <td>{d.fee ? `₹${d.fee.toLocaleString()}` : '—'}</td>
                      <td>{d.phone || '—'}</td>
                      <td>
                        <span className={`badge ${d.available ? 'badge-available' : 'badge-busy'}`}>
                          {d.available ? 'Available' : 'Busy'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn-icon" onClick={() => openEdit(d)}><Pencil size={14}/></button>
                          <button className="btn-icon danger" onClick={() => del(d)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {modal && (
        <Modal
          title={editing ? 'Edit Doctor' : 'Add New Doctor'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Add Doctor'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Doctor name"/>
            </div>
            <div className="form-group">
              <label className="form-label">Specialization *</label>
              <select className="form-control" value={form.specialization} onChange={e => set('specialization', e.target.value)}>
                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Experience (years)</label>
              <input className="form-control" type="number" value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g. 10"/>
            </div>
            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <input className="form-control" type="number" value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="e.g. 800"/>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number"/>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address"/>
            </div>
          </div>
          <div className="form-group">
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
              <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} style={{width:16,height:16}}/>
              <span className="form-label" style={{margin:0}}>Currently Available</span>
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', role:'Nurse', department:'', phone:'', email:'', shift:'Morning' };
const ROLES    = ['Head Nurse','Nurse','Lab Technician','Pharmacist','Receptionist','Radiologist','Physiotherapist','Cleaner','Security'];
const SHIFTS   = ['Morning','Evening','Night','Rotating'];
const DEPTS    = ['ICU','Emergency','Pediatrics','Maternity','Cardiology','Orthopedics','Pathology','Pharmacy','Front Desk','Radiology'];

export default function Staff() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);

  function load() {
    setLoading(true);
    getStaff().then(r => { setStaff(r.data); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd()   { setForm(EMPTY); setEditing(null); setModal(true); }
  function openEdit(s) { setForm({...s}); setEditing(s.id); setModal(true); }
  function set(k,v)    { setForm(f => ({...f,[k]:v})); }

  async function save() {
    if (!form.name || !form.role) return toast.error('Name and role required');
    setSaving(true);
    try {
      editing ? await updateStaff(editing, form) : await createStaff(form);
      toast.success(editing ? 'Staff updated' : 'Staff member added');
      load(); setModal(false);
    } catch { toast.error('Error saving staff'); }
    setSaving(false);
  }

  async function del(s) {
    if (!window.confirm(`Remove ${s.name}?`)) return;
    await deleteStaff(s.id);
    toast.success('Staff removed');
    load();
  }

  const shiftColor = { Morning:'badge-green', Evening:'badge-amber', Night:'badge-blue', Rotating:'badge-scheduled' };

  return (
    <div className="page">
      <div className="page-header">
        <div><h2>Staff</h2><p>{staff.length} non-clinical personnel</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Staff</button>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading
            ? <div className="loading-spinner"><div className="spinner"/><span>Loading…</span></div>
            : staff.length === 0
            ? <div className="empty-state"><UserCog size={48}/><h3>No staff records</h3></div>
            : <table>
                <thead><tr>
                  <th>Name</th><th>Role</th><th>Department</th>
                  <th>Shift</th><th>Phone</th><th>Email</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td><span className="fw-600">{s.name}</span></td>
                      <td><span className="badge badge-blue">{s.role}</span></td>
                      <td>{s.department || '—'}</td>
                      <td><span className={`badge ${shiftColor[s.shift] || 'badge-scheduled'}`}>{s.shift || '—'}</span></td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.email || '—'}</td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn-icon" onClick={() => openEdit(s)}><Pencil size={14}/></button>
                          <button className="btn-icon danger" onClick={() => del(s)}><Trash2 size={14}/></button>
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
          title={editing ? 'Edit Staff' : 'Add Staff Member'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Add Staff'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name',e.target.value)} placeholder="Staff member name"/>
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-control" value={form.role} onChange={e => set('role',e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" value={form.department} onChange={e => set('department',e.target.value)}>
                <option value="">Select</option>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Shift</label>
              <select className="form-control" value={form.shift} onChange={e => set('shift',e.target.value)}>
                {SHIFTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone',e.target.value)} placeholder="Phone number"/>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email',e.target.value)} placeholder="Email address"/>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

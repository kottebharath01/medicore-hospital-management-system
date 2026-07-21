import React, { useState, useEffect } from 'react';
import { getRecords, createRecord, deleteRecord, getPatients, getDoctors } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Trash2, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { patient_id:'', doctor_id:'', diagnosis:'', prescription:'', notes:'', date:'' };

export default function Records() {
  const [records,  setRecords]  = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  function load() {
    setLoading(true);
    getRecords(filter || undefined).then(r => { setRecords(r.data); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(load, [filter]);
  useEffect(() => {
    getPatients().then(r => setPatients(r.data));
    getDoctors().then(r => setDoctors(r.data));
  }, []);

  function set(k,v) { setForm(f => ({...f,[k]:v})); }

  async function save() {
    if (!form.patient_id || !form.doctor_id || !form.diagnosis)
      return toast.error('Patient, doctor and diagnosis are required');
    setSaving(true);
    try {
      await createRecord({ ...form, date: form.date || new Date().toISOString().split('T')[0] });
      toast.success('Record added');
      load(); setModal(false); setForm(EMPTY);
    } catch { toast.error('Error saving record'); }
    setSaving(false);
  }

  async function del(id) {
    if (!window.confirm('Delete this record?')) return;
    await deleteRecord(id);
    toast.success('Record deleted');
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><h2>Medical Records</h2><p>{records.length} records</p></div>
        <div className="flex gap-12">
          <div className="search-bar">
            <Search className="search-icon" size={15}/>
            <select className="form-control" style={{paddingLeft:36,width:200}} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Patients</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
            <Plus size={15}/>Add Record
          </button>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading
            ? <div className="loading-spinner"><div className="spinner"/><span>Loading…</span></div>
            : records.length === 0
            ? <div className="empty-state"><FileText size={48}/><h3>No records found</h3></div>
            : <table>
                <thead><tr>
                  <th>#</th><th>Patient</th><th>Doctor</th>
                  <th>Diagnosis</th><th>Prescription</th><th>Date</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td><span className="text-muted">#{r.id}</span></td>
                      <td><span className="fw-600">{r.patient_name}</span></td>
                      <td>Dr. {r.doctor_name}</td>
                      <td style={{maxWidth:200}}>{r.diagnosis}</td>
                      <td style={{maxWidth:200,color:'var(--text-muted)',fontSize:'0.82rem'}}>{r.prescription || '—'}</td>
                      <td>{new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td>
                        <button className="btn-icon danger" onClick={() => del(r.id)}><Trash2 size={14}/></button>
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
          title="Add Medical Record"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Record'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Patient *</label>
              <select className="form-control" value={form.patient_id} onChange={e => set('patient_id',e.target.value)}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor *</label>
              <select className="form-control" value={form.doctor_id} onChange={e => set('doctor_id',e.target.value)}>
                <option value="">Select doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-control" type="date" value={form.date} onChange={e => set('date',e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Diagnosis *</label>
            <textarea className="form-control" rows={2} value={form.diagnosis} onChange={e => set('diagnosis',e.target.value)} placeholder="Primary diagnosis…"/>
          </div>
          <div className="form-group">
            <label className="form-label">Prescription</label>
            <textarea className="form-control" rows={2} value={form.prescription} onChange={e => set('prescription',e.target.value)} placeholder="Medications and dosage…"/>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => set('notes',e.target.value)} placeholder="Additional notes…"/>
          </div>
        </Modal>
      )}
    </div>
  );
}

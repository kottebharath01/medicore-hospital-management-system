import React, { useState, useEffect, useCallback } from 'react';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment, getPatients, getDoctors } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Trash2, CheckCircle, XCircle, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { patient_id:'', doctor_id:'', date:'', time:'09:00', status:'Scheduled', notes:'' };

function Badge({ status }) {
  const cls = { Scheduled:'badge-scheduled', Completed:'badge-completed', Cancelled:'badge-cancelled' };
  return <span className={`badge ${cls[status] || 'badge-blue'}`}>{status}</span>;
}

export default function Appointments() {
  const [appts,    setAppts]    = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAppointments(filter).then(r => { setAppts(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getPatients().then(r => setPatients(r.data));
    getDoctors().then(r => setDoctors(r.data));
  }, []);

  function set(k,v) { setForm(f => ({...f, [k]:v})); }

  async function save() {
    if (!form.patient_id || !form.doctor_id || !form.date || !form.time)
      return toast.error('All fields are required');
    setSaving(true);
    try {
      await createAppointment(form);
      toast.success('Appointment scheduled');
      load(); setModal(false); setForm(EMPTY);
    } catch { toast.error('Error scheduling appointment'); }
    setSaving(false);
  }

  async function changeStatus(id, status) {
    await updateAppointment(id, { status });
    toast.success(`Marked as ${status}`);
    load();
  }

  async function del(id) {
    if (!window.confirm('Delete this appointment?')) return;
    await deleteAppointment(id);
    toast.success('Appointment deleted');
    load();
  }

  const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
    '12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

  return (
    <div className="page">
      <div className="page-header">
        <div><h2>Appointments</h2><p>{appts.length} total</p></div>
        <div className="flex gap-12">
          <select className="form-control" style={{width:160}} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option>Scheduled</option><option>Completed</option><option>Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
            <Plus size={15}/>Schedule
          </button>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading
            ? <div className="loading-spinner"><div className="spinner"/><span>Loading…</span></div>
            : appts.length === 0
            ? <div className="empty-state"><CalendarClock size={48}/><h3>No appointments</h3></div>
            : <table>
                <thead><tr>
                  <th>#</th><th>Patient</th><th>Doctor</th><th>Specialization</th>
                  <th>Date</th><th>Time</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {appts.map(a => (
                    <tr key={a.id}>
                      <td><span className="text-muted">#{a.id}</span></td>
                      <td><span className="fw-600">{a.patient_name}</span></td>
                      <td>Dr. {a.doctor_name}</td>
                      <td><span className="badge badge-blue">{a.doctor_specialization}</span></td>
                      <td>{new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                      <td>{a.time}</td>
                      <td><Badge status={a.status}/></td>
                      <td>
                        <div className="flex gap-8">
                          {a.status === 'Scheduled' && <>
                            <button className="btn-icon" title="Mark Completed" onClick={() => changeStatus(a.id,'Completed')}>
                              <CheckCircle size={14} color="var(--green)"/>
                            </button>
                            <button className="btn-icon" title="Cancel" onClick={() => changeStatus(a.id,'Cancelled')}>
                              <XCircle size={14} color="var(--coral)"/>
                            </button>
                          </>}
                          <button className="btn-icon danger" onClick={() => del(a.id)}><Trash2 size={14}/></button>
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
          title="Schedule Appointment"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Schedule'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Patient *</label>
              <select className="form-control" value={form.patient_id} onChange={e => set('patient_id', e.target.value)}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor *</label>
              <select className="form-control" value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)}>
                <option value="">Select doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name} — {d.specialization}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-control" type="date" value={form.date} onChange={e => set('date', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Time *</label>
              <select className="form-control" value={form.time} onChange={e => set('time', e.target.value)}>
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…"/>
          </div>
        </Modal>
      )}
    </div>
  );
}

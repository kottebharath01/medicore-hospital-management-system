import React, { useState, useEffect, useCallback } from 'react';
import {
  getAppointments, createAppointment, updateAppointment, deleteAppointment,
  getPatients, getDoctors, getDepartments
} from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Trash2, CheckCircle, XCircle, CalendarClock, CalendarPlus, Building2, Stethoscope, User } from 'lucide-react';
import toast from 'react-hot-toast';

function Badge({ status }) {
  const cls = {
    Scheduled: 'badge-scheduled',
    Confirmed: 'badge-blue',
    Completed: 'badge-completed',
    Cancelled: 'badge-cancelled'
  };
  return <span className={`badge ${cls[status] || 'badge-blue'}`}>{status}</span>;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00'
];

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Current session user
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isPatient = currentUser?.role === 'patient';
  const isDoctor = currentUser?.role === 'doctor';
  const isReceptionist = currentUser?.role === 'receptionist';
  const isAdmin = currentUser?.role === 'admin';
  const canBook = isPatient || isReceptionist;

  // Booking Form State
  const [form, setForm] = useState({
    patient_id: currentUser?.patient_id || '',
    department_id: '',
    doctor_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: '',
  });

  const load = useCallback(() => {
    setLoading(true);
    getAppointments(filter)
      .then((r) => {
        setAppts(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getDepartments().then((r) => setDepartments(r.data)).catch(() => {});
    getDoctors().then((r) => setDoctors(r.data)).catch(() => {});
    if (!isPatient) {
      getPatients().then((r) => setPatients(r.data)).catch(() => {});
    }
  }, [isPatient]);

  const filteredDoctors = form.department_id
    ? doctors.filter((d) => String(d.department_id) === String(form.department_id))
    : doctors;

  async function handleBookAppointment(e) {
    e.preventDefault();
    if (!form.doctor_id || !form.date || !form.time) {
      return toast.error('Doctor, date, and time slot are required');
    }
    if (!isPatient && !form.patient_id) {
      return toast.error('Please select a patient');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        patient_id: isPatient ? (currentUser.patient_id || form.patient_id) : form.patient_id,
      };
      const res = await createAppointment(payload);
      toast.success(`Appointment scheduled successfully! ID: ${res.data.code || 'APT-0001'}`);
      setModal(false);
      setForm({
        patient_id: currentUser?.patient_id || '',
        department_id: '',
        doctor_id: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        notes: '',
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateAppointment(id, { status });
      toast.success(`Status updated to ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to cancel and delete this appointment?')) return;
    try {
      await deleteAppointment(id);
      toast.success('Appointment cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete appointment');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>
            {isPatient
              ? 'My Appointments'
              : isDoctor
              ? 'My Patient Consultations'
              : isReceptionist
              ? 'Front Desk Appointments & Scheduling'
              : 'Appointments Monitoring & Reports'}
          </h2>
          <p>
            {isPatient
              ? `Scheduled consultations for ${currentUser?.name || currentUser?.username} (${currentUser?.patient_code || 'PAT-0001'})`
              : isDoctor
              ? `Clinical consultation appointments assigned to Dr. ${currentUser?.name || currentUser?.username}`
              : isReceptionist
              ? `${appts.length} appointments recorded • Front desk booking and consultation management`
              : `${appts.length} appointments recorded • Hospital Administration Monitoring`}
          </p>
        </div>

        <div className="flex gap-12">
          <select
            className="form-control"
            style={{ width: 160 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option>Scheduled</option>
            <option>Confirmed</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>

          {canBook && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setForm({
                  patient_id: isPatient ? (currentUser?.patient_id || '') : '',
                  department_id: '',
                  doctor_id: '',
                  date: new Date().toISOString().split('T')[0],
                  time: '10:00',
                  notes: '',
                });
                setModal(true);
              }}
            >
              <CalendarPlus size={15} /> {isPatient ? 'Book Appointment' : 'Schedule Appointment'}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Loading appointments…</span>
            </div>
          ) : appts.length === 0 ? (
            <div className="empty-state">
              <CalendarClock size={48} color="var(--text-muted)" />
              <h3>No appointments found</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isPatient ? 'You have no scheduled visits. Click "Book Appointment" above to see a doctor.' : 'No appointment records match the current filter.'}
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Appt Code</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="badge badge-blue">{a.code || `APT-${a.id}`}</span>
                    </td>
                    <td>
                      <span className="fw-600">{a.patient_name}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>
                        {a.patient_code || `PAT-${a.patient_id}`}
                      </span>
                    </td>
                    <td>{a.doctor_name}</td>
                    <td>
                      <span className="badge badge-blue">
                        {a.department_name || a.doctor_specialization || 'Clinical'}
                      </span>
                    </td>
                    <td>
                      {new Date(a.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <strong>{a.time}</strong>
                    </td>
                    <td>
                      <Badge status={a.status} />
                    </td>
                    <td>
                      <div className="flex gap-6">
                        {/* Doctor and Admin can mark as Completed */}
                        {(isDoctor || isAdminOrDesk) && a.status !== 'Completed' && (
                          <button
                            className="btn-icon success"
                            title="Mark as Completed"
                            onClick={() => handleStatusChange(a.id, 'Completed')}
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}

                        {/* Any role can cancel */}
                        {a.status !== 'Cancelled' && (
                          <button
                            className="btn-icon danger"
                            title="Cancel appointment"
                            onClick={() => handleStatusChange(a.id, 'Cancelled')}
                          >
                            <XCircle size={15} />
                          </button>
                        )}

                        {/* Admin can delete record */}
                        {isAdminOrDesk && (
                          <button
                            className="btn-icon danger"
                            title="Delete permanently"
                            onClick={() => handleDelete(a.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Book / Schedule Appointment Modal (Prompt Section 22) ─── */}
      {modal && (
        <Modal
          title={isPatient ? "Book Doctor Appointment" : "Schedule New Appointment"}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBookAppointment} disabled={saving}>
                {saving ? 'Booking…' : 'Confirm Appointment'}
              </button>
            </>
          }
        >
          <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Patient Auto-Display (Section 22: Logged-in user name & patient ID auto-obtained) */}
            {isPatient ? (
              <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={18} color="#16a34a" />
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>Authenticated Patient:</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#14532d' }}>
                    {currentUser?.name || currentUser?.username} • <span style={{ fontFamily: 'monospace' }}>{currentUser?.patient_code || 'PAT-0001'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Select Patient *</label>
                <select
                  required
                  className="form-control"
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code || `PAT-${p.id}`}) • {p.gender}, {p.age}y
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Selection */}
            <div className="form-group">
              <label className="form-label">Select Clinical Department</label>
              <select
                className="form-control"
                value={form.department_id}
                onChange={(e) => {
                  setForm({ ...form, department_id: e.target.value, doctor_id: '' });
                }}
              >
                <option value="">All Departments / Specialties</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selection (Filtered by Department) */}
            <div className="form-group">
              <label className="form-label">Select Doctor *</label>
              <select
                required
                className="form-control"
                value={form.doctor_id}
                onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
              >
                <option value="">-- Choose Consulting Doctor --</option>
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.code}) • {doc.specialization} • Fee: ₹{doc.fee}
                  </option>
                ))}
              </select>
              {filteredDoctors.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--coral)' }}>
                  No doctors found in this department. Please choose another department or view all.
                </span>
              )}
            </div>

            {/* Date Selection */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Appointment Date *</label>
                <input
                  required
                  type="date"
                  className="form-control"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              {/* Time Slots */}
              <div className="form-group">
                <label className="form-label">Preferred Time Slot *</label>
                <select
                  className="form-control"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason / Notes */}
            <div className="form-group">
              <label className="form-label">Reason for Visit / Symptoms</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Brief description of symptoms or consultation reason"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

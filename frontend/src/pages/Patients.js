import React, { useState, useEffect, useCallback } from 'react';
import { getPatients, getPatient, createPatient, updatePatient, deletePatient, recordVitals } from '../utils/api';
import Modal from '../components/Modal';
import { Search, Plus, Pencil, Trash2, Eye, Activity, HeartPulse, BedDouble, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name: '', age: '', gender: 'Male', blood_group: 'O+', phone: '', email: '', address: '' };
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // 'form' | 'details' | 'vitals'
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Patient detail modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Vitals recording form
  const [vitalsForm, setVitalsForm] = useState({
    patient_id: '',
    nurse_name: '',
    blood_pressure: '120/80',
    heart_rate: '72',
    temperature: '98.6',
    respiratory_rate: '16',
    oxygen_saturation: '98',
    notes: '',
  });

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isNurse = currentUser?.role === 'nurse';
  const isAdmin = currentUser?.role === 'admin';
  const isReceptionist = currentUser?.role === 'receptionist';
  const isPatient = currentUser?.role === 'patient';

  const load = useCallback(() => {
    setLoading(true);
    getPatients(q)
      .then((r) => {
        setPatients(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  function openAdd() {
    setForm(EMPTY);
    setEditing(null);
    setModal('form');
  }

  function openEdit(p) {
    setForm({ ...p });
    setEditing(p.id);
    setModal('form');
  }

  async function openDetails(p) {
    setModal('details');
    setDetailLoading(true);
    try {
      const res = await getPatient(p.id);
      setSelectedPatient(res.data);
    } catch {
      toast.error('Failed to load patient history');
    } finally {
      setDetailLoading(false);
    }
  }

  function openRecordVitals(p) {
    setVitalsForm({
      patient_id: p.id,
      nurse_name: currentUser?.name || 'Staff Nurse',
      blood_pressure: '120/80',
      heart_rate: '72',
      temperature: '98.6',
      respiratory_rate: '16',
      oxygen_saturation: '98',
      notes: '',
    });
    setModal('vitals');
  }

  async function savePatient() {
    if (!form.name || !form.age || !form.gender) {
      return toast.error('Name, age, and gender are required');
    }
    setSaving(true);
    try {
      if (editing) {
        await updatePatient(editing, form);
        toast.success('Patient updated');
      } else {
        const res = await createPatient(form);
        toast.success(`Patient registered! ID: ${res.data.code || 'PAT-0001'}`);
      }
      load();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function saveVitals(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await recordVitals(vitalsForm);
      toast.success('Vitals recorded successfully');
      setModal(null);
      if (selectedPatient) {
        openDetails(selectedPatient);
      }
    } catch (err) {
      toast.error('Failed to record vitals');
    } finally {
      setSaving(false);
    }
  }

  async function del(p) {
    if (!window.confirm(`Permanently remove patient ${p.name}?`)) return;
    try {
      await deletePatient(p.id);
      toast.success('Patient removed');
      load();
    } catch {
      toast.error('Failed to delete patient');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{isPatient ? 'My Patient Profile' : 'Hospital Patients Directory'}</h2>
          <p>
            {isPatient
              ? `Personal health record for ${currentUser?.name || currentUser?.username} (${currentUser?.patient_code || 'PAT-0001'})`
              : isAdmin
              ? `${patients.length} registered patients • Administration Monitoring & Oversight`
              : isReceptionist
              ? `${patients.length} registered patients • Front Desk Patient Registration & Management`
              : `${patients.length} registered patients in the database`}
          </p>
        </div>

        <div className="flex gap-12">
          <div className="search-bar">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search by name, PAT ID, phone..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {isReceptionist && (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={15} /> Register Patient
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Loading patients…</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <h3>No patients found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age / Gender</th>
                  <th>Blood Group</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>City / Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-blue">{p.code || `PAT-${String(p.id).padStart(4, '0')}`}</span>
                    </td>
                    <td>
                      <span className="fw-600" style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => openDetails(p)}>
                        {p.name}
                      </span>
                    </td>
                    <td>{p.age} yrs • {p.gender}</td>
                    <td>
                      <span className="badge badge-coral">{p.blood_group || '—'}</span>
                    </td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.email || '—'}</td>
                    <td>{p.address || '—'}</td>
                    <td>
                      <div className="flex gap-6">
                        <button
                          className="btn-icon"
                          title="View Medical Profile & Vitals"
                          onClick={() => openDetails(p)}
                        >
                          <Eye size={15} />
                        </button>
                        {isNurse && (
                          <button
                            className="btn-icon success"
                            title="Record Vitals"
                            onClick={() => openRecordVitals(p)}
                          >
                            <HeartPulse size={15} />
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          title="Edit Patient"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            className="btn-icon danger"
                            title="Delete Patient"
                            onClick={() => del(p)}
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

      {/* ─── Add/Edit Patient Modal ─── */}
      {modal === 'form' && (
        <Modal
          title={editing ? 'Edit Patient Profile' : 'Register New Patient'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePatient} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Patient' : 'Register Patient'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Patient's full name"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className="form-control"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="Age"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  className="form-control"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select
                  className="form-control"
                  value={form.blood_group}
                  onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Contact phone"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address / Residence</label>
              <input
                className="form-control"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Residential address"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Patient Clinical Profile Modal (Medical History + Vitals + Bed) ─── */}
      {modal === 'details' && selectedPatient && (
        <Modal
          title={`Clinical Profile: ${selectedPatient.name} (${selectedPatient.code})`}
          onClose={() => setModal(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              {isNurse && (
                <button className="btn btn-outline" onClick={() => openRecordVitals(selectedPatient)}>
                  <HeartPulse size={14} /> Record New Vitals
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setModal(null)} style={{ marginLeft: 'auto' }}>
                Close
              </button>
            </div>
          }
        >
          {detailLoading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Loading clinical records…</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Patient Basic Demographics Card */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demographics:</span>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.gender}, {selectedPatient.age} yrs • Blood Group: <span style={{ color: 'var(--coral)' }}>{selectedPatient.blood_group || 'O+'}</span></div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact:</span>
                  <div>{selectedPatient.phone || '—'} • {selectedPatient.email || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Bed:</span>
                  <div>
                    {selectedPatient.current_bed ? (
                      <span className="badge badge-coral">
                        <BedDouble size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {selectedPatient.current_bed.bed_number} ({selectedPatient.current_bed.ward_name})
                      </span>
                    ) : (
                      <span className="badge badge-blue">Out-Patient</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vital Signs Section (Section 8: Patient Vitals & Nursing Updates) */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={16} color="var(--primary-color)" /> Recent Vital Signs (Nursing Records)
                </h4>
                {(!selectedPatient.vital_signs || selectedPatient.vital_signs.length === 0) ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No vital signs recorded yet.</p>
                ) : (
                  <div className="table-wrapper" style={{ maxHeight: 160, overflowY: 'auto' }}>
                    <table style={{ fontSize: '0.78rem' }}>
                      <thead>
                        <tr>
                          <th>Recorded At</th>
                          <th>Nurse</th>
                          <th>BP</th>
                          <th>Heart Rate</th>
                          <th>Temp</th>
                          <th>SpO2</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPatient.vital_signs.map((v) => (
                          <tr key={v.id}>
                            <td>{new Date(v.recorded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                            <td>{v.nurse_name}</td>
                            <td><strong>{v.blood_pressure || '—'}</strong></td>
                            <td>{v.heart_rate ? `${v.heart_rate} bpm` : '—'}</td>
                            <td>{v.temperature ? `${v.temperature}°F` : '—'}</td>
                            <td>{v.oxygen_saturation ? `${v.oxygen_saturation}%` : '—'}</td>
                            <td>{v.notes || 'Normal'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Medical Records Section (Section 16: Diagnosis, Prescriptions, Treatments) */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} color="var(--primary-color)" /> Medical History & Diagnoses
                </h4>
                {(!selectedPatient.medical_records || selectedPatient.medical_records.length === 0) ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No medical records on file.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                    {selectedPatient.medical_records.map((r) => (
                      <div key={r.id} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{r.diagnosis}</span>
                          <span className="badge badge-blue">{r.code}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
                          Attending: Dr. {r.doctor_name} • Date: {r.date}
                        </div>
                        {r.prescription && <div><strong>Prescription:</strong> {r.prescription}</div>}
                        {r.treatment && <div><strong>Treatment:</strong> {r.treatment}</div>}
                        {r.medicines && <div><strong>Medicines:</strong> {r.medicines}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ─── Record Vitals Modal (for Nurse Role) ─── */}
      {modal === 'vitals' && (
        <Modal
          title="Record Patient Vital Signs"
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveVitals} disabled={saving}>
                {saving ? 'Saving…' : 'Record Vitals'}
              </button>
            </>
          }
        >
          <form onSubmit={saveVitals} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Blood Pressure (mmHg) *</label>
                <input
                  required
                  className="form-control"
                  placeholder="e.g. 120/80"
                  value={vitalsForm.blood_pressure}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Heart Rate (bpm)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 72"
                  value={vitalsForm.heart_rate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="e.g. 98.6"
                  value={vitalsForm.temperature}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Oxygen Saturation SpO2 (%)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 99"
                  value={vitalsForm.oxygen_saturation}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, oxygen_saturation: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nursing Observation / Notes</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Patient response, discomfort, or nursing care remarks"
                value={vitalsForm.notes}
                onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

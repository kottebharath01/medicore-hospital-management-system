import React, { useState, useEffect, useCallback } from 'react';
import { getRecords, createRecord, deleteRecord, getPatients, getDoctors } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Trash2, FileText, Search, Eye, Stethoscope, User, Calendar, Pill, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  patient_id: '',
  doctor_id: '',
  diagnosis: '',
  prescription: '',
  treatment: '',
  medicines: '',
  notes: '',
  date: '',
};

export default function Records() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientFilter, setPatientFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const currentUser = (() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const isPatient = currentUser?.role === 'patient';
  const isDoctor = currentUser?.role === 'doctor';
  const canAdd = ['admin', 'doctor', 'nurse'].includes(currentUser?.role);

  const load = useCallback(() => {
    setLoading(true);
    getRecords(patientFilter || undefined)
      .then((r) => {
        setRecords(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [patientFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isPatient) {
      getPatients()
        .then((r) => setPatients(r.data || []))
        .catch(() => {});
    }
    getDoctors()
      .then((r) => setDoctors(r.data || []))
      .catch(() => {});
  }, [isPatient]);

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openAddModal() {
    setForm({
      ...EMPTY,
      doctor_id: isDoctor && currentUser?.doctor_id ? String(currentUser.doctor_id) : '',
      date: new Date().toISOString().split('T')[0],
    });
    setModal(true);
  }

  function openDetailView(rec) {
    setSelectedRecord(rec);
    setDetailModal(true);
  }

  async function save() {
    if (!form.patient_id) return toast.error('Please select a patient');
    if (!form.doctor_id) return toast.error('Please select an attending doctor');
    if (!form.diagnosis.trim()) return toast.error('Diagnosis is required');

    setSaving(true);
    try {
      await createRecord({
        ...form,
        patient_id: parseInt(form.patient_id, 10),
        doctor_id: parseInt(form.doctor_id, 10),
        date: form.date || new Date().toISOString().split('T')[0],
      });
      toast.success('Medical record saved successfully');
      setModal(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save medical record');
    } finally {
      setSaving(false);
    }
  }

  async function del(id) {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await deleteRecord(id);
      toast.success('Record deleted');
      load();
    } catch {
      toast.error('Failed to delete record');
    }
  }

  const filteredRecords = records.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
      (r.patient_code && r.patient_code.toLowerCase().includes(q)) ||
      (r.doctor_name && r.doctor_name.toLowerCase().includes(q)) ||
      (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
      (r.treatment && r.treatment.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Medical Records</h2>
          <p>
            {isPatient
              ? `Your personal clinical medical history (${records.length} records)`
              : `Clinical consultations, diagnoses, and prescriptions (${records.length} records)`}
          </p>
        </div>
        <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
          {!isPatient && (
            <div className="search-bar">
              <Search className="search-icon" size={15} />
              <select
                className="form-control"
                style={{ paddingLeft: 36, width: 200 }}
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
              >
                <option value="">All Patients</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || `PAT-${String(p.id).padStart(4, '0')}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="search-bar">
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search diagnosis, doctor, code…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {canAdd && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={15} /> Add Record
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Loading medical records…</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No medical records found</h3>
              <p>
                {searchTerm || patientFilter
                  ? 'Try clearing the search query or patient filter.'
                  : 'No consultation records have been filed yet.'}
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Record Code</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Diagnosis</th>
                  <th>Treatment</th>
                  <th>Prescription / Meds</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="badge badge-blue">{r.code || `MED-${String(r.id).padStart(4, '0')}`}</span>
                    </td>
                    <td>
                      <div>
                        <span className="fw-600">{r.patient_name}</span>
                        {r.patient_code && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.patient_code}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="fw-600">Dr. {r.doctor_name}</span>
                        {r.doctor_specialization && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {r.doctor_specialization}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ maxWidth: 200, fontWeight: 500 }}>{r.diagnosis}</td>
                    <td style={{ maxWidth: 180, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {r.treatment || '—'}
                    </td>
                    <td style={{ maxWidth: 200, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {r.medicines || r.prescription || '—'}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {r.date
                          ? new Date(r.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button
                          className="btn-icon"
                          title="View Full Record"
                          onClick={() => openDetailView(r)}
                        >
                          <Eye size={14} />
                        </button>
                        {!isPatient && (
                          <button
                            className="btn-icon danger"
                            title="Delete Record"
                            onClick={() => del(r.id)}
                          >
                            <Trash2 size={14} />
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

      {/* MODAL: ADD MEDICAL RECORD */}
      {modal && (
        <Modal
          title="Add New Medical Record"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Record'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Patient *</label>
              <select
                className="form-control"
                value={form.patient_id}
                onChange={(e) => setField('patient_id', e.target.value)}
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || `PAT-${String(p.id).padStart(4, '0')}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Attending Doctor *</label>
              <select
                className="form-control"
                value={form.doctor_id}
                onChange={(e) => setField('doctor_id', e.target.value)}
              >
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} ({d.specialization} · {d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Consultation Date</label>
              <input
                className="form-control"
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Diagnosis *</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.diagnosis}
              onChange={(e) => setField('diagnosis', e.target.value)}
              placeholder="Primary diagnosis, findings, clinical condition…"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Treatment Plan</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.treatment}
              onChange={(e) => setField('treatment', e.target.value)}
              placeholder="Recommended medical procedure, therapy, lifestyle advice…"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prescription & Medicines</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.medicines}
              onChange={(e) => {
                setField('medicines', e.target.value);
                setField('prescription', e.target.value);
              }}
              placeholder="Medications, dosage, frequency (e.g. Paracetamol 500mg TDS x 5 days)…"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Notes</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Additional remarks or follow-up instructions…"
            />
          </div>
        </Modal>
      )}

      {/* MODAL: VIEW RECORD DETAILS */}
      {detailModal && selectedRecord && (
        <Modal
          title={`Clinical Record: ${selectedRecord.code || `MED-${selectedRecord.id}`}`}
          onClose={() => setDetailModal(false)}
          footer={
            <button className="btn btn-primary" onClick={() => setDetailModal(false)}>
              Close
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header info */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                background: 'var(--bg-main)',
                padding: 14,
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedRecord.patient_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>
                  {selectedRecord.patient_code || `PAT-${selectedRecord.patient_id}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attending Doctor</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Dr. {selectedRecord.doctor_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedRecord.doctor_specialization || 'Clinical Specialist'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {selectedRecord.date
                    ? new Date(selectedRecord.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div style={{ borderLeft: '4px solid var(--blue)', paddingLeft: 12 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                PRIMARY DIAGNOSIS
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{selectedRecord.diagnosis}</div>
            </div>

            {/* Treatment */}
            {selectedRecord.treatment && (
              <div style={{ borderLeft: '4px solid var(--green)', paddingLeft: 12 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  TREATMENT PLAN
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {selectedRecord.treatment}
                </div>
              </div>
            )}

            {/* Medicines / Prescription */}
            {(selectedRecord.medicines || selectedRecord.prescription) && (
              <div style={{ borderLeft: '4px solid var(--amber)', paddingLeft: 12 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  PRESCRIPTION & MEDICINES
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {selectedRecord.medicines || selectedRecord.prescription}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedRecord.notes && (
              <div style={{ borderLeft: '4px solid var(--border)', paddingLeft: 12 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  CLINICAL NOTES
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                  {selectedRecord.notes}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

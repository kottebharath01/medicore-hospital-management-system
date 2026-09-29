import React, { useState, useEffect, useCallback } from 'react';
import {
  getWards,
  createWard,
  updateWard,
  deleteWard,
  getAllBeds,
  createBed,
  updateBed,
  deleteBed,
  getPatients,
  getDoctors,
} from '../utils/api';
import Modal from '../components/Modal';
import {
  Plus,
  Pencil,
  Trash2,
  BedDouble,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  UserCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_WARD = { name: '', ward_type: 'General', capacity: '10', floor: '1' };
const WARD_TYPES = ['General', 'Intensive', 'Pediatric', 'Maternity', 'Specialty', 'Surgical', 'Emergency'];
const BED_STATUSES = ['Available', 'Occupied', 'Reserved', 'Maintenance'];

export default function Wards() {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view: 'wards' or 'beds'
  const [activeTab, setActiveTab] = useState('wards');

  // Filters
  const [selectedWardFilter, setSelectedWardFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals state
  const [wardModal, setWardModal] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [wardForm, setWardForm] = useState(EMPTY_WARD);
  const [savingWard, setSavingWard] = useState(false);

  const [addBedModal, setAddBedModal] = useState(false);
  const [bedForm, setBedForm] = useState({ ward_id: '', bed_number: '', status: 'Available', notes: '' });
  const [savingBed, setSavingBed] = useState(false);

  const [allocateModal, setAllocateModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [allocForm, setAllocForm] = useState({
    status: 'Available',
    patient_id: '',
    assigned_doctor_id: '',
    notes: '',
  });
  const [savingAlloc, setSavingAlloc] = useState(false);

  // User role check
  const currentUser = (() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();
  const canManage = currentUser?.role && ['admin', 'nurse', 'receptionist'].includes(currentUser.role);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      getWards(),
      getAllBeds(),
      getPatients().catch(() => ({ data: [] })),
      getDoctors().catch(() => ({ data: [] })),
    ])
      .then(([wRes, bRes, pRes, dRes]) => {
        setWards(wRes.data || []);
        setBeds(bRes.data || []);
        setPatients(pRes.data || []);
        setDoctors(dRes.data || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load wards and beds data');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ward CRUD
  function openAddWard() {
    setWardForm(EMPTY_WARD);
    setEditingWard(null);
    setWardModal(true);
  }

  function openEditWard(w) {
    setWardForm({
      name: w.name,
      ward_type: w.ward_type || 'General',
      capacity: w.capacity || 10,
      floor: w.floor ?? 1,
    });
    setEditingWard(w.id);
    setWardModal(true);
  }

  async function saveWard() {
    if (!wardForm.name.trim()) return toast.error('Ward name is required');
    if (!wardForm.capacity) return toast.error('Capacity is required');
    setSavingWard(true);
    try {
      if (editingWard) {
        await updateWard(editingWard, wardForm);
        toast.success('Ward updated successfully');
      } else {
        await createWard(wardForm);
        toast.success('Ward created successfully');
      }
      setWardModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save ward');
    } finally {
      setSavingWard(false);
    }
  }

  async function handleDeleteWard(w) {
    if (!window.confirm(`Are you sure you want to delete ward "${w.name}"? This will delete all its beds.`)) return;
    try {
      await deleteWard(w.id);
      toast.success('Ward deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to delete ward');
    }
  }

  // Bed CRUD
  function openAddBed(defaultWardId = '') {
    setBedForm({
      ward_id: defaultWardId || (wards[0]?.id ? String(wards[0].id) : ''),
      bed_number: '',
      status: 'Available',
      notes: '',
    });
    setAddBedModal(true);
  }

  async function saveNewBed() {
    if (!bedForm.ward_id) return toast.error('Please select a ward');
    if (!bedForm.bed_number.trim()) return toast.error('Bed number is required');
    setSavingBed(true);
    try {
      await createBed(bedForm);
      toast.success('Bed created successfully');
      setAddBedModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add bed');
    } finally {
      setSavingBed(false);
    }
  }

  function openAllocateBed(bed) {
    setSelectedBed(bed);
    setAllocForm({
      status: bed.status || 'Available',
      patient_id: bed.patient_id ? String(bed.patient_id) : '',
      assigned_doctor_id: bed.assigned_doctor_id ? String(bed.assigned_doctor_id) : '',
      notes: bed.notes || '',
    });
    setAllocateModal(true);
  }

  async function saveAllocation() {
    if (!selectedBed) return;
    setSavingAlloc(true);
    try {
      const payload = {
        status: allocForm.status,
        patient_id: allocForm.patient_id ? parseInt(allocForm.patient_id, 10) : null,
        assigned_doctor_id: allocForm.assigned_doctor_id ? parseInt(allocForm.assigned_doctor_id, 10) : null,
        notes: allocForm.notes,
      };
      await updateBed(selectedBed.id, payload);
      toast.success('Bed status updated successfully');
      setAllocateModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update bed status');
    } finally {
      setSavingAlloc(false);
    }
  }

  async function handleDischarge(bed) {
    if (!window.confirm(`Discharge patient from Bed ${bed.bed_number} and set status to Available?`)) return;
    try {
      await updateBed(bed.id, { status: 'Available', patient_id: null, notes: '' });
      toast.success(`Patient discharged from Bed ${bed.bed_number}`);
      loadData();
    } catch {
      toast.error('Failed to discharge patient');
    }
  }

  async function handleDeleteBed(bed) {
    if (!window.confirm(`Delete Bed ${bed.bed_number} (${bed.code})?`)) return;
    try {
      await deleteBed(bed.id);
      toast.success('Bed deleted');
      loadData();
    } catch {
      toast.error('Failed to delete bed');
    }
  }

  // Filter beds
  const filteredBeds = beds.filter((b) => {
    if (selectedWardFilter && String(b.ward_id) !== String(selectedWardFilter)) return false;
    if (selectedStatusFilter && b.status !== selectedStatusFilter) return false;
    return true;
  });

  const totalBeds = wards.reduce((s, w) => s + (w.capacity || 0), 0);
  const occupiedBeds = wards.reduce((s, w) => s + (w.occupied || 0), 0);
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  function getStatusBadge(status) {
    switch (status) {
      case 'Available':
        return (
          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> Available
          </span>
        );
      case 'Occupied':
        return (
          <span className="badge badge-coral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={12} /> Occupied
          </span>
        );
      case 'Reserved':
        return (
          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> Reserved
          </span>
        );
      case 'Maintenance':
        return (
          <span className="badge badge-scheduled" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Wrench size={12} /> Maintenance
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  }

  return (
    <div className="page">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h2>Wards & Bed Management</h2>
          <p>
            {occupiedBeds}/{totalBeds} Beds Occupied ({occupancyRate}% Occupancy) across {wards.length} Wards
          </p>
        </div>
        {canManage && (
          <div className="flex gap-12">
            <button className="btn btn-outline" onClick={() => openAddBed()}>
              <Plus size={15} /> Add Bed
            </button>
            <button className="btn btn-primary" onClick={openAddWard}>
              <Plus size={15} /> Add Ward
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--blue)',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{wards.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hospital Wards</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <BedDouble size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalBeds}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Beds</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green)',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>{availableBeds}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Available Beds</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#ffe4e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--coral)',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--coral)' }}>{occupiedBeds}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Occupied Beds</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'wards' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('wards')}
        >
          <Layers size={15} /> Wards Overview ({wards.length})
        </button>
        <button
          className={`btn ${activeTab === 'beds' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
          onClick={() => setActiveTab('beds')}
        >
          <BedDouble size={15} /> All Beds Management ({beds.length})
        </button>
      </div>

      {/* TAB 1: WARDS OVERVIEW */}
      {activeTab === 'wards' && (
        <>
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <span>Loading wards…</span>
            </div>
          ) : wards.length === 0 ? (
            <div className="empty-state">
              <BedDouble size={48} />
              <h3>No wards registered</h3>
              <p>Add hospital wards to track bed occupancy.</p>
            </div>
          ) : (
            <div className="ward-grid">
              {wards.map((w) => {
                const pct = w.capacity ? Math.round((w.occupied / w.capacity) * 100) : 0;
                const fillClass = pct > 85 ? 'danger' : pct > 65 ? 'warning' : '';
                return (
                  <div className="ward-card" key={w.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                            {w.code || `WRD-${String(w.id).padStart(4, '0')}`}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{w.name}</h4>
                        </div>
                        <p className="ward-type" style={{ marginTop: 4 }}>
                          {w.ward_type} · Floor {w.floor ?? '—'}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-8">
                          <button className="btn-icon" title="Edit Ward" onClick={() => openEditWard(w)}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn-icon danger" title="Delete Ward" onClick={() => handleDeleteWard(w)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="ward-bed-info" style={{ marginTop: 8 }}>
                      <span>
                        Occupied: <strong style={{ color: 'var(--coral)' }}>{w.occupied}</strong>
                      </span>
                      <span>
                        Available: <strong style={{ color: 'var(--green)' }}>{w.available}</strong>
                      </span>
                      <span>
                        Total: <strong>{w.capacity}</strong>
                      </span>
                    </div>

                    <div className="progress-bar" style={{ marginTop: 10 }}>
                      <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pct}% Occupancy</span>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => {
                          setSelectedWardFilter(String(w.id));
                          setActiveTab('beds');
                        }}
                      >
                        <BedDouble size={13} /> View Beds
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: BED ALLOCATION & GRID */}
      {activeTab === 'beds' && (
        <div>
          {/* Bed Filters */}
          <div className="flex gap-12" style={{ marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter by:</span>
            </div>

            <select
              className="form-control"
              style={{ width: 200 }}
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value)}
            >
              <option value="">All Wards ({wards.length})</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.ward_type})
                </option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: 170 }}
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {BED_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {(selectedWardFilter || selectedStatusFilter) && (
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => {
                  setSelectedWardFilter('');
                  setSelectedStatusFilter('');
                }}
              >
                Clear Filters
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredBeds.length} of {beds.length} beds
            </div>
          </div>

          {/* Beds Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner" />
                  <span>Loading beds…</span>
                </div>
              ) : filteredBeds.length === 0 ? (
                <div className="empty-state">
                  <BedDouble size={48} />
                  <h3>No beds match current filters</h3>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Bed Code</th>
                      <th>Bed #</th>
                      <th>Ward</th>
                      <th>Status</th>
                      <th>Assigned Patient</th>
                      <th>Attending Doctor</th>
                      <th>Notes</th>
                      {canManage && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBeds.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <span className="badge badge-blue">{b.code || `BED-${String(b.id).padStart(4, '0')}`}</span>
                        </td>
                        <td>
                          <strong>{b.bed_number}</strong>
                        </td>
                        <td>
                          <span>{b.ward_name || wards.find((w) => w.id === b.ward_id)?.name || `Ward #${b.ward_id}`}</span>
                        </td>
                        <td>{getStatusBadge(b.status)}</td>
                        <td>
                          {b.patient_name || b.patient?.name ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{b.patient_name || b.patient?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {b.patient_code || b.patient?.code || `PAT-${b.patient_id}`}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>— Unassigned —</span>
                          )}
                        </td>
                        <td>
                          {b.doctor_name || b.doctor?.name ? (
                            `Dr. ${b.doctor_name || b.doctor?.name}`
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 180 }}>
                          {b.notes || '—'}
                        </td>
                        {canManage && (
                          <td>
                            <div className="flex gap-8">
                              <button
                                className="btn btn-outline"
                                style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                                title="Update Status or Patient"
                                onClick={() => openAllocateBed(b)}
                              >
                                <UserCheck size={12} /> Manage
                              </button>
                              {b.status === 'Occupied' && (
                                <button
                                  className="btn-icon"
                                  style={{ color: 'var(--coral)' }}
                                  title="Discharge Patient"
                                  onClick={() => handleDischarge(b)}
                                >
                                  <UserX size={14} />
                                </button>
                              )}
                              <button
                                className="btn-icon danger"
                                title="Delete Bed"
                                onClick={() => handleDeleteBed(b)}
                              >
                                <Trash2 size={13} />
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
        </div>
      )}

      {/* MODAL: ADD / EDIT WARD */}
      {wardModal && (
        <Modal
          title={editingWard ? 'Edit Ward' : 'Add New Hospital Ward'}
          onClose={() => setWardModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setWardModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveWard} disabled={savingWard}>
                {savingWard ? 'Saving…' : editingWard ? 'Update Ward' : 'Create Ward'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ward Name *</label>
              <input
                className="form-control"
                value={wardForm.name}
                onChange={(e) => setWardForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Intensive Care Unit"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ward Type</label>
              <select
                className="form-control"
                value={wardForm.ward_type}
                onChange={(e) => setWardForm((f) => ({ ...f, ward_type: e.target.value }))}
              >
                {WARD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Bed Capacity *</label>
              <input
                className="form-control"
                type="number"
                min="1"
                value={wardForm.capacity}
                onChange={(e) => setWardForm((f) => ({ ...f, capacity: e.target.value }))}
                placeholder="Number of beds"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Floor Number</label>
              <input
                className="form-control"
                type="number"
                value={wardForm.floor}
                onChange={(e) => setWardForm((f) => ({ ...f, floor: e.target.value }))}
                placeholder="e.g. 1"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADD BED */}
      {addBedModal && (
        <Modal
          title="Add New Bed"
          onClose={() => setAddBedModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setAddBedModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveNewBed} disabled={savingBed}>
                {savingBed ? 'Adding…' : 'Add Bed'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Hospital Ward *</label>
              <select
                className="form-control"
                value={bedForm.ward_id}
                onChange={(e) => setBedForm((f) => ({ ...f, ward_id: e.target.value }))}
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.ward_type} · Floor {w.floor})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bed Number *</label>
              <input
                className="form-control"
                value={bedForm.bed_number}
                onChange={(e) => setBedForm((f) => ({ ...f, bed_number: e.target.value }))}
                placeholder="e.g. B-101 or ICU-04"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-control"
                value={bedForm.status}
                onChange={(e) => setBedForm((f) => ({ ...f, status: e.target.value }))}
              >
                {BED_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input
                className="form-control"
                value={bedForm.notes}
                onChange={(e) => setBedForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Near ventilator, Window view"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: MANAGE / ALLOCATE BED */}
      {allocateModal && selectedBed && (
        <Modal
          title={`Manage Bed ${selectedBed.bed_number} (${selectedBed.code || 'BED'})`}
          onClose={() => setAllocateModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setAllocateModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveAllocation} disabled={savingAlloc}>
                {savingAlloc ? 'Saving…' : 'Save Bed Status'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Bed Status *</label>
              <select
                className="form-control"
                value={allocForm.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setAllocForm((f) => ({
                    ...f,
                    status: newStatus,
                    patient_id: newStatus === 'Available' ? '' : f.patient_id,
                  }));
                }}
              >
                {BED_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Patient</label>
              <select
                className="form-control"
                value={allocForm.patient_id}
                onChange={(e) => {
                  const pid = e.target.value;
                  setAllocForm((f) => ({
                    ...f,
                    patient_id: pid,
                    status: pid ? 'Occupied' : f.status,
                  }));
                }}
              >
                <option value="">— None / Discharge Patient —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || `PAT-${String(p.id).padStart(4, '0')}`})
                  </option>
                ))}
              </select>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Selecting a patient automatically marks bed as Occupied.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Attending Doctor</label>
              <select
                className="form-control"
                value={allocForm.assigned_doctor_id}
                onChange={(e) => setAllocForm((f) => ({ ...f, assigned_doctor_id: e.target.value }))}
              >
                <option value="">— None —</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                className="form-control"
                value={allocForm.notes}
                onChange={(e) => setAllocForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Clinical or operational notes"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

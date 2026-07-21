import React, { useState, useEffect } from 'react';
import { getWards, createWard, updateWard, deleteWard } from '../utils/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, BedDouble } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', ward_type:'General', capacity:'', occupied:'0', floor:'' };
const WARD_TYPES = ['General','Intensive','Pediatric','Maternity','Specialty','Surgical','Emergency'];

function WardCard({ w, onEdit, onDelete }) {
  const pct = w.capacity ? Math.round((w.occupied / w.capacity) * 100) : 0;
  const fillClass = pct > 85 ? 'danger' : pct > 65 ? 'warning' : '';
  return (
    <div className="ward-card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div>
          <h4>{w.name}</h4>
          <p className="ward-type">{w.ward_type} · Floor {w.floor ?? '—'}</p>
        </div>
        <div className="flex gap-8">
          <button className="btn-icon" onClick={() => onEdit(w)}><Pencil size={13}/></button>
          <button className="btn-icon danger" onClick={() => onDelete(w)}><Trash2 size={13}/></button>
        </div>
      </div>
      <div className="ward-bed-info">
        <span>Occupied: <strong>{w.occupied}</strong></span>
        <span>Available: <strong style={{color:'var(--green)'}}>{w.available}</strong></span>
        <span>Total: <strong>{w.capacity}</strong></span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${fillClass}`} style={{width:`${pct}%`}}/>
      </div>
      <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:8,textAlign:'right'}}>{pct}% occupancy</p>
    </div>
  );
}

export default function Wards() {
  const [wards,   setWards]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);

  function load() {
    setLoading(true);
    getWards().then(r => { setWards(r.data); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd()   { setForm(EMPTY); setEditing(null); setModal(true); }
  function openEdit(w) { setForm({...w}); setEditing(w.id); setModal(true); }
  function set(k,v)    { setForm(f => ({...f,[k]:v})); }

  async function save() {
    if (!form.name || !form.capacity) return toast.error('Name and capacity required');
    setSaving(true);
    try {
      editing ? await updateWard(editing, form) : await createWard(form);
      toast.success(editing ? 'Ward updated' : 'Ward added');
      load(); setModal(false);
    } catch { toast.error('Error saving ward'); }
    setSaving(false);
  }

  async function del(w) {
    if (!window.confirm(`Delete ward ${w.name}?`)) return;
    await deleteWard(w.id);
    toast.success('Ward deleted');
    load();
  }

  const totalBeds    = wards.reduce((s,w) => s + w.capacity, 0);
  const occupiedBeds = wards.reduce((s,w) => s + w.occupied, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Wards & Beds</h2>
          <p>{occupiedBeds}/{totalBeds} beds occupied across {wards.length} wards</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Ward</button>
      </div>

      {loading
        ? <div className="loading-spinner"><div className="spinner"/><span>Loading…</span></div>
        : wards.length === 0
        ? <div className="empty-state"><BedDouble size={48}/><h3>No wards yet</h3></div>
        : <div className="ward-grid">
            {wards.map(w => <WardCard key={w.id} w={w} onEdit={openEdit} onDelete={del}/>)}
          </div>
      }

      {modal && (
        <Modal
          title={editing ? 'Edit Ward' : 'Add Ward'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Add Ward'}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ward Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name',e.target.value)} placeholder="e.g. General Ward A"/>
            </div>
            <div className="form-group">
              <label className="form-label">Ward Type</label>
              <select className="form-control" value={form.ward_type} onChange={e => set('ward_type',e.target.value)}>
                {WARD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Capacity *</label>
              <input className="form-control" type="number" value={form.capacity} onChange={e => set('capacity',e.target.value)} placeholder="Number of beds"/>
            </div>
            <div className="form-group">
              <label className="form-label">Currently Occupied</label>
              <input className="form-control" type="number" value={form.occupied} onChange={e => set('occupied',e.target.value)} placeholder="Beds in use"/>
            </div>
            <div className="form-group">
              <label className="form-label">Floor</label>
              <input className="form-control" type="number" value={form.floor} onChange={e => set('floor',e.target.value)} placeholder="Floor number"/>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

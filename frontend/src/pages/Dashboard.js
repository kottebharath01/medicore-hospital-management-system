import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getBedOccupancy } from '../utils/api';
import Modal from '../components/Modal';
import {
  Users, Stethoscope, CalendarClock, BedDouble,
  UserCog, TrendingUp, Clock, CheckCircle, Building2,
  CalendarPlus, Shield, HeartPulse, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0f4c81', '#00a99d', '#e8534a', '#f5a623', '#27ae60', '#7c3aed'];

const weekData = [
  { day: 'Mon', appointments: 8 },
  { day: 'Tue', appointments: 12 },
  { day: 'Wed', appointments: 6 },
  { day: 'Thu', appointments: 15 },
  { day: 'Fri', appointments: 10 },
  { day: 'Sat', appointments: 5 },
  { day: 'Sun', appointments: 3 },
];

function StatCard({ icon: Icon, label, value, color, onClick, clickable = false }) {
  return (
    <div
      className={`stat-card ${clickable ? 'clickable-card' : ''}`}
      onClick={onClick}
      style={{ cursor: clickable ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
      title={clickable ? `Click to view ${label} details` : undefined}
    >
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <h3>{value ?? '—'}</h3>
        <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label} {clickable && <ArrowRight size={11} style={{ opacity: 0.7 }} />}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === 'Scheduled' ? 'badge-scheduled'
    : status === 'Confirmed' ? 'badge-blue'
    : status === 'Completed' ? 'badge-completed'
    : 'badge-cancelled';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive Bed Occupancy Modal state
  const [bedModal, setBedModal] = useState(false);
  const [occupiedBeds, setOccupiedBeds] = useState([]);
  const [bedLoading, setBedLoading] = useState(false);

  const user = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    getDashboard()
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError("Unable to connect to the hospital backend. If the server is on a free tier spin-up, please wait a moment and click Retry.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openBedOccupancyModal = () => {
    setBedModal(true);
    setBedLoading(true);
    getBedOccupancy()
      .then((r) => {
        setOccupiedBeds(r.data);
        setBedLoading(false);
      })
      .catch(() => setBedLoading(false));
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 500, margin: "60px auto", textAlign: "center", padding: 32 }}>
          <h3 style={{ marginBottom: 12, color: "var(--text-color)" }}>Connection Notice</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>{error || "Unable to load dashboard data."}</p>
          <button className="btn btn-primary" onClick={fetchDashboard} style={{ margin: "0 auto" }}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { stats, recent_appointments } = data;
  const bedPct = stats.total_beds ? Math.round((stats.occupied_beds / stats.total_beds) * 100) : 0;

  const pieData = [
    { name: 'Scheduled', value: stats.scheduled_appointments },
    { name: 'Available Doctors', value: stats.available_doctors },
    { name: 'Occupied Beds', value: stats.occupied_beds },
    { name: 'Staff', value: stats.total_staff },
  ];

  return (
    <div className="page">
      {/* ─── Role-Based Welcome Banner ─── */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #0f4c81 0%, #1a649f 100%)', color: '#fff', padding: '22px 26px', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff' }}>
              Welcome, {user?.name || user?.username || 'Guest'}!
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.86rem' }}>
              {user?.role === 'patient' && (
                <span>
                  Registered Patient • <strong>Patient ID: {user.patient_code || 'PAT-0001'}</strong> • You can schedule visits and view your prescriptions.
                </span>
              )}
              {user?.role === 'doctor' && (
                <span>
                  Attending Physician • Department consultation and patient clinical history overview.
                </span>
              )}
              {user?.role === 'nurse' && (
                <span>
                  Nursing Personnel • In-patient ward allocation, vital signs recording, and monitoring.
                </span>
              )}
              {user?.role === 'receptionist' && (
                <span>
                  Front Desk Staff • Patient registration, doctor appointment bookings, and bed allocation.
                </span>
              )}
              {user?.role === 'admin' && (
                <span>
                  Hospital Administrator • Full access to users, doctors, clinical departments, wards, and reporting.
                </span>
              )}
              {!user && (
                <span>
                  Hospital Overview • Live operational status and department directory. Sign in to access your role.
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {user?.role === 'patient' ? (
              <button
                className="btn"
                style={{ background: '#00a99d', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => nav('/appointments')}
              >
                <CalendarPlus size={16} /> Book Appointment
              </button>
            ) : user?.role === 'nurse' ? (
              <button
                className="btn"
                style={{ background: '#00a99d', color: '#fff', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => nav('/wards')}
              >
                <BedDouble size={16} /> View Wards & Beds
              </button>
            ) : (
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => nav('/departments')}
              >
                <Building2 size={16} /> Departments
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Interactive Overview Cards ─── */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={stats.total_patients}
          color="blue"
          clickable={true}
          onClick={() => nav('/patients')}
        />
        <StatCard
          icon={Stethoscope}
          label="Doctors on Staff"
          value={stats.total_doctors}
          color="teal"
          clickable={true}
          onClick={() => nav('/doctors')}
        />
        <StatCard
          icon={CalendarClock}
          label="Today's Visits"
          value={stats.today_appointments}
          color="amber"
          clickable={true}
          onClick={() => nav('/appointments')}
        />
        <StatCard
          icon={Clock}
          label="Scheduled Appts"
          value={stats.scheduled_appointments}
          color="coral"
          clickable={true}
          onClick={() => nav('/appointments')}
        />
        <StatCard
          icon={BedDouble}
          label="Bed Occupancy"
          value={`${stats.occupied_beds}/${stats.total_beds}`}
          color="purple"
          clickable={true}
          onClick={openBedOccupancyModal}
        />
        <StatCard
          icon={Building2}
          label="Departments"
          value={stats.total_departments || 7}
          color="green"
          clickable={true}
          onClick={() => nav('/departments')}
        />
      </div>

      {/* ─── Charts Row ─── */}
      <div className="dashboard-grid wide" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-color)' }}>
            Appointments This Week
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7c93' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7c93' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f0f4f8' }} contentStyle={{ borderRadius: 8, border: '1px solid #dde3ed', fontSize: 13 }} />
              <Bar dataKey="appointments" fill="var(--navy)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 20 }}>Hospital at a Glance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dde3ed', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Bed & Doctor Availability Row ─── */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="card" onClick={openBedOccupancyModal} style={{ cursor: 'pointer' }} title="Click to view detailed occupied beds">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Bed Occupancy
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>Click for details &rarr;</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {stats.occupied_beds} of {stats.total_beds} beds occupied
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: bedPct > 80 ? 'var(--coral)' : bedPct > 60 ? 'var(--amber)' : 'var(--green)' }}>
              {bedPct}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className={`progress-fill ${bedPct > 80 ? 'danger' : bedPct > 60 ? 'warning' : ''}`}
              style={{ width: `${bedPct}%` }}
            />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10 }}>
            {stats.available_beds ?? (stats.total_beds - stats.occupied_beds)} beds available across {stats.total_wards} wards
          </p>
        </div>

        <div className="card" onClick={() => nav('/doctors')} style={{ cursor: 'pointer' }} title="Click to view all doctors">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Doctor Availability</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>View Doctors &rarr;</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {stats.available_doctors} of {stats.total_doctors} available
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--teal)' }}>
              {stats.total_doctors ? Math.round((stats.available_doctors / stats.total_doctors) * 100) : 0}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className="progress-fill"
              style={{ width: `${stats.total_doctors ? (stats.available_doctors / stats.total_doctors) * 100 : 0}%` }}
            />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10 }}>
            {stats.total_doctors - stats.available_doctors} currently in consultation or off-duty
          </p>
        </div>
      </div>

      {/* ─── Recent Appointments Table ─── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Appointments</h3>
          <TrendingUp size={16} color="var(--text-muted)" />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Appt ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent_appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    No appointments yet
                  </td>
                </tr>
              ) : (
                recent_appointments.map((a) => (
                  <tr key={a.id}>
                    <td><span className="badge badge-blue">{a.code || `APT-${a.id}`}</span></td>
                    <td>
                      <span className="fw-600">{a.patient_name}</span>
                      {a.patient_code && <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>{a.patient_code}</span>}
                    </td>
                    <td>{a.doctor_name}</td>
                    <td><span className="badge badge-blue">{a.department_name || a.doctor_specialization}</span></td>
                    <td>{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{a.time}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Interactive Bed Occupancy Modal (Prompt Section 18) ─── */}
      {bedModal && (
        <Modal
          title="Hospital Bed Occupancy Details"
          onClose={() => setBedModal(false)}
          footer={
            <button className="btn btn-primary" onClick={() => setBedModal(false)}>
              Close
            </button>
          }
        >
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Real-time database records of currently occupied hospital beds, admitted patients, and supervising physicians.
            </p>

            {bedLoading ? (
              <div className="loading-spinner" style={{ padding: 24 }}>
                <div className="spinner" />
                <span>Loading occupied bed records…</span>
              </div>
            ) : occupiedBeds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                No beds are currently occupied.
              </div>
            ) : (
              <div className="table-wrapper" style={{ maxHeight: 380, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Bed Number</th>
                      <th>Patient ID</th>
                      <th>Patient Name</th>
                      <th>Ward</th>
                      <th>Doctor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupiedBeds.map((b) => (
                      <tr key={b.id}>
                        <td><span className="fw-600">{b.bed_number}</span> <span className="text-muted" style={{ fontSize: '0.75rem' }}>({b.code})</span></td>
                        <td><span className="badge badge-blue">{b.patient_code || `PAT-${b.patient_id}`}</span></td>
                        <td><strong>{b.patient_name || 'Admitted Patient'}</strong></td>
                        <td>{b.ward_name}</td>
                        <td>{b.doctor_name || 'Attending Physician'}</td>
                        <td><span className="badge badge-coral">{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

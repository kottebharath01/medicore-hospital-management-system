import React, { useState, useEffect } from 'react';
import { getDashboard } from '../utils/api';
import {
  Users, Stethoscope, CalendarClock, BedDouble,
  UserCog, TrendingUp, Clock, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0f4c81','#00a99d','#e8534a','#f5a623','#27ae60','#7c3aed'];

const weekData = [
  {day:'Mon',appointments:8},{day:'Tue',appointments:12},{day:'Wed',appointments:6},
  {day:'Thu',appointments:15},{day:'Fri',appointments:10},{day:'Sat',appointments:5},{day:'Sun',appointments:3},
];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <h3>{value ?? '—'}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === 'Scheduled' ? 'badge-scheduled'
            : status === 'Completed' ? 'badge-completed'
            : 'badge-cancelled';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard().then(r => setData(r.data)).catch(console.error);
  }, []);

  if (!data) return (
    <div className="page">
      <div className="loading-spinner"><div className="spinner"/><span>Loading dashboard…</span></div>
    </div>
  );

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
      <div className="page-header">
        <div>
          <h2>Hospital Overview</h2>
          <p>Live snapshot of MediCore operations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={Users}        label="Total Patients"     value={stats.total_patients}     color="blue" />
        <StatCard icon={Stethoscope}  label="Doctors on Staff"   value={stats.total_doctors}      color="teal" />
        <StatCard icon={CalendarClock}label="Today's Visits"     value={stats.today_appointments} color="amber" />
        <StatCard icon={Clock}        label="Scheduled Appts"    value={stats.scheduled_appointments} color="coral" />
        <StatCard icon={BedDouble}    label="Beds Occupied"      value={`${stats.occupied_beds}/${stats.total_beds}`} color="purple" />
        <StatCard icon={UserCog}      label="Total Staff"        value={stats.total_staff}        color="green" />
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid wide" style={{marginBottom:24}}>
        <div className="card">
          <h3 style={{fontSize:'0.95rem',fontWeight:700,marginBottom:20,color:'var(--text)'}}>
            Appointments This Week
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" />
              <XAxis dataKey="day" tick={{fontSize:12,fill:'#6b7c93'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:12,fill:'#6b7c93'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill:'#f0f4f8'}} contentStyle={{borderRadius:8,border:'1px solid #dde3ed',fontSize:13}} />
              <Bar dataKey="appointments" fill="var(--navy)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{fontSize:'0.95rem',fontWeight:700,marginBottom:20}}>Hospital at a Glance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{borderRadius:8,border:'1px solid #dde3ed',fontSize:13}} />
              <Legend wrapperStyle={{fontSize:12}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bed Occupancy */}
      <div className="dashboard-grid" style={{marginBottom:24}}>
        <div className="card">
          <h3 style={{fontSize:'0.95rem',fontWeight:700,marginBottom:16}}>Bed Occupancy</h3>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>
              {stats.occupied_beds} of {stats.total_beds} beds occupied
            </span>
            <span style={{fontSize:'0.82rem',fontWeight:700,color: bedPct>80 ? 'var(--coral)' : bedPct>60 ? 'var(--amber)' : 'var(--green)'}}>
              {bedPct}%
            </span>
          </div>
          <div className="progress-bar" style={{height:10}}>
            <div
              className={`progress-fill ${bedPct>80 ? 'danger' : bedPct>60 ? 'warning' : ''}`}
              style={{width:`${bedPct}%`}}
            />
          </div>
          <p style={{fontSize:'0.78rem',color:'var(--text-muted)',marginTop:10}}>
            {stats.total_beds - stats.occupied_beds} beds available across {stats.total_wards} wards
          </p>
        </div>

        <div className="card">
          <h3 style={{fontSize:'0.95rem',fontWeight:700,marginBottom:16}}>Doctor Availability</h3>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:'0.82rem',color:'var(--text-muted)'}}>
              {stats.available_doctors} of {stats.total_doctors} available
            </span>
            <span style={{fontSize:'0.82rem',fontWeight:700,color:'var(--teal)'}}>
              {stats.total_doctors ? Math.round((stats.available_doctors/stats.total_doctors)*100) : 0}%
            </span>
          </div>
          <div className="progress-bar" style={{height:10}}>
            <div
              className="progress-fill"
              style={{width:`${stats.total_doctors ? (stats.available_doctors/stats.total_doctors)*100 : 0}%`}}
            />
          </div>
          <p style={{fontSize:'0.78rem',color:'var(--text-muted)',marginTop:10}}>
            {stats.total_doctors - stats.available_doctors} currently with patients or off-duty
          </p>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <h3 style={{fontSize:'0.95rem',fontWeight:700}}>Recent Appointments</h3>
          <TrendingUp size={16} color="var(--text-muted)" />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Doctor</th><th>Specialization</th>
                <th>Date</th><th>Time</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent_appointments.length === 0
                ? <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text-muted)',padding:32}}>No appointments yet</td></tr>
                : recent_appointments.map(a => (
                  <tr key={a.id}>
                    <td><span className="fw-600">{a.patient_name}</span></td>
                    <td>{a.doctor_name}</td>
                    <td><span className="badge badge-blue">{a.doctor_specialization}</span></td>
                    <td>{new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                    <td>{a.time}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

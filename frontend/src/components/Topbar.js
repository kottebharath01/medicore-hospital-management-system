import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

const titles = {
  '/':             ['Dashboard',      'Welcome back, Admin'],
  '/patients':     ['Patients',       'Manage patient records'],
  '/doctors':      ['Doctors',        'Medical staff directory'],
  '/appointments': ['Appointments',   'Schedule & track visits'],
  '/records':      ['Medical Records','Patient history & diagnoses'],
  '/wards':        ['Wards & Beds',   'Facility occupancy overview'],
  '/staff':        ['Staff',          'Non-clinical personnel'],
};

export default function Topbar() {
  const loc = useLocation();
  const [title, sub] = titles[loc.pathname] || ['MediCore', ''];
  const now = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <div className="topbar-right">
        <span className="topbar-badge">{now}</span>
        <button className="btn-icon"><Bell size={16} /></button>
        <div className="topbar-avatar">AD</div>
      </div>
    </header>
  );
}

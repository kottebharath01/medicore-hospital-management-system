import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, CalendarClock,
  FileText, BedDouble, UserCog, Activity
} from 'lucide-react';

const navItems = [
  { label: 'Overview',      path: '/',             icon: LayoutDashboard },
  { section: 'Clinical' },
  { label: 'Patients',      path: '/patients',     icon: Users },
  { label: 'Doctors',       path: '/doctors',      icon: Stethoscope },
  { label: 'Appointments',  path: '/appointments', icon: CalendarClock },
  { label: 'Medical Records', path: '/records',    icon: FileText },
  { section: 'Facility' },
  { label: 'Wards & Beds',  path: '/wards',        icon: BedDouble },
  { label: 'Staff',         path: '/staff',        icon: UserCog },
];

export default function Sidebar() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1><span>Medi</span>Core</h1>
        <p>Hospital Management</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-label">{item.section}</div>
          ) : (
            <button
              key={item.path}
              className={`nav-item ${loc.pathname === item.path ? 'active' : ''}`}
              onClick={() => nav(item.path)}
            >
              <item.icon className="icon" size={18} />
              {item.label}
            </button>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <Activity size={14} style={{marginBottom:4, display:'block', margin:'0 auto 4px'}} />
        MediCore HMS v1.0
      </div>
    </aside>
  );
}

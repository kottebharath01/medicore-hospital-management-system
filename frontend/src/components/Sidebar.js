import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, CalendarClock,
  FileText, BedDouble, UserCog, Building2, Activity, CalendarPlus
} from 'lucide-react';

export default function Sidebar() {
  const loc = useLocation();
  const nav = useNavigate();

  const user = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const role = user?.role || 'guest';

  // Role-specific navigation items
  let navItems = [];

  if (role === 'patient') {
    navItems = [
      { label: 'My Dashboard', path: '/', icon: LayoutDashboard },
      { section: 'Patient Care' },
      { label: 'Book Appointment', path: '/appointments', icon: CalendarPlus },
      { label: 'My Appointments', path: '/appointments', icon: CalendarClock },
      { label: 'My Medical Records', path: '/records', icon: FileText },
      { section: 'Hospital' },
      { label: 'Our Doctors', path: '/doctors', icon: Stethoscope },
      { label: 'Departments', path: '/departments', icon: Building2 },
    ];
  } else if (role === 'doctor') {
    navItems = [
      { label: 'Doctor Overview', path: '/', icon: LayoutDashboard },
      { section: 'Clinical Work' },
      { label: 'My Appointments', path: '/appointments', icon: CalendarClock },
      { label: 'Assigned Patients', path: '/patients', icon: Users },
      { label: 'Medical Records', path: '/records', icon: FileText },
      { section: 'Hospital' },
      { label: 'Departments', path: '/departments', icon: Building2 },
    ];
  } else if (role === 'nurse') {
    navItems = [
      { label: 'Nurse Overview', path: '/', icon: LayoutDashboard },
      { section: 'Ward Care' },
      { label: 'Wards & Beds', path: '/wards', icon: BedDouble },
      { label: 'Patients & Vitals', path: '/patients', icon: Users },
      { section: 'Personnel' },
      { label: 'Staff Roster', path: '/staff', icon: UserCog },
    ];
  } else if (role === 'receptionist') {
    navItems = [
      { label: 'Front Desk', path: '/', icon: LayoutDashboard },
      { section: 'Desk Operations' },
      { label: 'Patients Directory', path: '/patients', icon: Users },
      { label: 'Appointments', path: '/appointments', icon: CalendarClock },
      { label: 'Bed Availability', path: '/wards', icon: BedDouble },
      { section: 'Hospital' },
      { label: 'Doctors On Duty', path: '/doctors', icon: Stethoscope },
      { label: 'Departments', path: '/departments', icon: Building2 },
    ];
  } else {
    // Admin & Guest: Full access
    navItems = [
      { label: 'Overview', path: '/', icon: LayoutDashboard },
      { section: 'Clinical' },
      { label: 'Patients', path: '/patients', icon: Users },
      { label: 'Doctors', path: '/doctors', icon: Stethoscope },
      { label: 'Appointments', path: '/appointments', icon: CalendarClock },
      { label: 'Medical Records', path: '/records', icon: FileText },
      { label: 'Departments', path: '/departments', icon: Building2 },
      { section: 'Facility & Staff' },
      { label: 'Wards & Beds', path: '/wards', icon: BedDouble },
      { label: 'Staff', path: '/staff', icon: UserCog },
    ];
  }

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
              key={`${item.path}-${item.label}`}
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
        <Activity size={14} style={{ marginBottom: 4, display: 'block', margin: '0 auto 4px' }} />
        MediCore HMS • Role: <strong style={{ textTransform: 'capitalize' }}>{role}</strong>
      </div>
    </aside>
  );
}

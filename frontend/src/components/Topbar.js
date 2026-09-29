import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, LogIn, LogOut, Shield, RefreshCw } from 'lucide-react';
import { loginUser } from '../utils/api';
import Modal from './Modal';
import toast from 'react-hot-toast';

const titles = {
  '/':             ['Dashboard',      'Live Hospital Operations'],
  '/patients':     ['Patients',       'Manage patient records'],
  '/doctors':      ['Doctors',        'Medical staff directory'],
  '/appointments': ['Appointments',   'Schedule & track visits'],
  '/records':      ['Medical Records','Patient history & diagnoses'],
  '/wards':        ['Wards & Beds',   'Facility occupancy overview'],
  '/staff':        ['Staff',          'Non-clinical personnel'],
};

const DEMO_ROLES = [
  { label: 'Admin', username: 'admin', pass: 'admin123', role: 'admin', color: '#0f4c81' },
  { label: 'Doctor', username: 'doctor', pass: 'doctor123', role: 'doctor', color: '#00a99d' },
  { label: 'Nurse', username: 'nurse', pass: 'nurse123', role: 'nurse', color: '#e8534a' },
  { label: 'Receptionist', username: 'receptionist', pass: 'reception123', role: 'receptionist', color: '#f5a623' },
  { label: 'Staff', username: 'user', pass: 'user123', role: 'staff', color: '#7c3aed' },
];

export default function Topbar() {
  const loc = useLocation();
  const [title, sub] = titles[loc.pathname] || ['MediCore', ''];
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [modal, setModal] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  async function handleLogin(u = username, p = password) {
    setLoading(true);
    try {
      const res = await loginUser({ username: u, password: p });
      const userData = res.data.user;
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Welcome, ${userData.username} (${userData.role})!`);
      setModal(false);
    } catch (err) {
      const msg = err.response?.data?.error || (err.response ? 'Invalid credentials' : 'Could not reach server. Please check backend connection.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  }

  const initials = user ? user.username.slice(0, 2).toUpperCase() : 'GU';

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
        <p>{user ? `${sub} • Logged in as ${user.username} (${user.role})` : `${sub} • Guest Mode`}</p>
      </div>

      <div className="topbar-right">
        <span className="topbar-badge">{now}</span>
        <button className="btn-icon" title="Notifications"><Bell size={16} /></button>

        {user ? (
          <div className="flex gap-8" style={{ alignItems: 'center' }}>
            <div className="topbar-avatar" title={`${user.username} (${user.role})`}>
              {initials}
            </div>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Switch to another role or account"
              onClick={() => setModal(true)}
            >
              <RefreshCw size={12} /> Switch Role
            </button>
            <button className="btn-icon danger" title="Sign Out" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setModal(true)}>
            <LogIn size={15} /> Sign In
          </button>
        )}
      </div>

      {modal && (
        <Modal
          title={user ? `Switch Account (Current: ${user.username})` : "Sign In to MediCore"}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleLogin()} disabled={loading}>
                {loading ? 'Authenticating…' : 'Sign In'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: 8 }}>
                <Shield size={15} color="var(--primary-color)" /> Quick Demo Role Login:
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                Select any hospital role below to immediately sign in and switch roles:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                {DEMO_ROLES.map((r) => (
                  <button
                    key={r.username}
                    type="button"
                    className="btn btn-outline"
                    style={{
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      borderLeft: `3px solid ${r.color}`,
                    }}
                    onClick={() => {
                      setUsername(r.username);
                      setPassword(r.pass);
                      handleLogin(r.username, r.pass);
                    }}
                    disabled={loading}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{r.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.username}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              — or sign in with custom credentials —
            </div>

            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <input
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username or email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
}

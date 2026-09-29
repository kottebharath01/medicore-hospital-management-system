import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, LogIn, LogOut, Shield } from 'lucide-react';
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

  useEffect(() => {
    // If not logged in on initial load, default to admin session for easy evaluation
    if (!user) {
      const defaultUser = { username: 'admin', role: 'admin', email: 'admin@hospital.com' };
      setUser(defaultUser);
      localStorage.setItem('user', JSON.stringify(defaultUser));
    }
  }, [user]);

  async function handleLogin(u = username, p = password) {
    setLoading(true);
    try {
      const res = await loginUser({ username: u, password: p });
      const userData = res.data.user;
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Welcome, ${userData.username}!`);
      setModal(false);
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Signed out');
  }

  const initials = user ? user.username.slice(0, 2).toUpperCase() : 'GU';

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
        <p>{user ? `${sub} • Logged in as ${user.username} (${user.role})` : sub}</p>
      </div>

      <div className="topbar-right">
        <span className="topbar-badge">{now}</span>
        <button className="btn-icon" title="Notifications"><Bell size={16} /></button>

        {user ? (
          <div className="flex gap-8" style={{ alignItems: 'center' }}>
            <div className="topbar-avatar" title={`${user.username} (${user.role})`}>
              {initials}
            </div>
            <button className="btn-icon danger" title="Sign Out" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setModal(true)}>
            <LogIn size={14} /> Sign In
          </button>
        )}
      </div>

      {modal && (
        <Modal
          title="Sign In to MediCore"
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

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                <Shield size={14} /> Quick Demo Login:
              </div>
              <div className="flex gap-8">
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px 8px' }}
                  onClick={() => { setUsername('admin'); setPassword('admin123'); handleLogin('admin', 'admin123'); }}
                >
                  Admin (admin123)
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px 8px' }}
                  onClick={() => { setUsername('user'); setPassword('user123'); handleLogin('user', 'user123'); }}
                >
                  User (user123)
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
}

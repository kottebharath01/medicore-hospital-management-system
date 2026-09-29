import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, LogIn, LogOut, Shield, RefreshCw, KeyRound, UserPlus } from 'lucide-react';
import { loginUser, registerUser, changePassword } from '../utils/api';
import Modal from './Modal';
import toast from 'react-hot-toast';

const titles = {
  '/':             ['Dashboard',        'Live Hospital Operations'],
  '/departments': ['Departments',      'Clinical departments & specialties'],
  '/patients':     ['Patients',         'Manage patient records'],
  '/doctors':      ['Doctors',          'Medical staff directory'],
  '/appointments': ['Appointments',     'Schedule & track visits'],
  '/records':      ['Medical Records',  'Patient history & diagnoses'],
  '/wards':        ['Wards & Beds',     'Facility occupancy overview'],
  '/staff':        ['Staff',            'Non-clinical personnel'],
};

const DEMO_ROLES = [
  { label: 'Admin', username: 'admin', pass: 'admin123', role: 'admin', color: '#0f4c81' },
  { label: 'Doctor', username: 'doctor', pass: 'doctor123', role: 'doctor', color: '#00a99d' },
  { label: 'Nurse', username: 'nurse', pass: 'nurse123', role: 'nurse', color: '#e8534a' },
  { label: 'Receptionist', username: 'receptionist', pass: 'receptionist123', role: 'receptionist', color: '#f5a623' },
  { label: 'Patient', username: 'patient', pass: 'patient123', role: 'patient', color: '#7c3aed' },
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

  const [loginModal, setLoginModal] = useState(false);
  const [regModal, setRegModal] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);

  // Login form state
  const [username, setUsername] = useState('patient');
  const [password, setPassword] = useState('patient123');
  const [loading, setLoading] = useState(false);

  // Register form state
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    age: '',
    gender: 'Male',
    phone: '',
    blood_group: 'O+',
    address: '',
  });

  // Change password state
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  async function handleLogin(u = username, p = password) {
    setLoading(true);
    try {
      const res = await loginUser({ username: u, password: p });
      const userData = res.data.user;
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Welcome, ${userData.name || userData.username} (${userData.role})!`);
      setLoginModal(false);
      window.location.reload(); // Refresh session across views
    } catch (err) {
      const msg = err.response?.data?.error || (err.response ? 'Invalid credentials' : 'Could not reach server.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regForm.name || !regForm.username || !regForm.email || !regForm.password) {
      return toast.error('Name, username, email, and password are required');
    }
    setLoading(true);
    try {
      const res = await registerUser(regForm);
      const userData = res.data.user;
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success(`Account registered! Your Patient ID is ${userData.patient_code || 'PAT-0001'}`);
      setRegModal(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!pwdForm.current_password || !pwdForm.new_password) {
      return toast.error('Current and new password are required');
    }
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      const res = await changePassword(pwdForm);
      toast.success(res.data.message || 'Password changed successfully');
      setPwdModal(false);
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.reload();
  }

  const initials = user ? (user.name || user.username).slice(0, 2).toUpperCase() : 'GU';

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
        <p>
          {user
            ? `Welcome, ${user.name || user.username} • Role: ${user.role}${user.patient_code ? ` (Patient ID: ${user.patient_code})` : ''}`
            : `${sub} • Guest Mode`}
        </p>
      </div>

      <div className="topbar-right">
        <span className="topbar-badge">{now}</span>

        {user ? (
          <div className="flex gap-8" style={{ alignItems: 'center' }}>
            <div className="topbar-avatar" title={`${user.name || user.username} (${user.role})`}>
              {initials}
            </div>

            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Change your account password"
              onClick={() => setPwdModal(true)}
            >
              <KeyRound size={12} /> Password
            </button>

            <button
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Switch to another role or account"
              onClick={() => setLoginModal(true)}
            >
              <RefreshCw size={12} /> Switch Role
            </button>

            <button className="btn-icon danger" title="Sign Out" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-8">
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setRegModal(true)}
            >
              <UserPlus size={14} /> Register Patient
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setLoginModal(true)}
            >
              <LogIn size={15} /> Sign In
            </button>
          </div>
        )}
      </div>

      {/* ─── Sign In / Role Switcher Modal ─── */}
      {loginModal && (
        <Modal
          title={user ? `Switch Account (Current: ${user.username})` : "Sign In to MediCore"}
          onClose={() => setLoginModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setLoginModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleLogin()} disabled={loading}>
                {loading ? 'Authenticating…' : 'Sign In'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: 8 }}>
                <Shield size={15} color="var(--primary-color)" /> 1-Click Role Switcher:
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                Select any hospital role below to immediately test its unique dashboard and permissions:
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
              — or enter credentials manually —
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

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>New patient? </span>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.78rem', color: 'var(--primary-color)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
                onClick={() => { setLoginModal(false); setRegModal(true); }}
              >
                Register here
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Patient Registration Modal ─── */}
      {regModal && (
        <Modal
          title="New Patient Registration"
          onClose={() => setRegModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setRegModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
                {loading ? 'Creating Account…' : 'Register & Log In'}
              </button>
            </>
          }
        >
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Create your patient account to book appointments, view assigned doctors, and track your clinical records.
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  required
                  className="form-control"
                  placeholder="e.g. Bharath Kotte"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  required
                  className="form-control"
                  placeholder="e.g. bharath"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  required
                  type="email"
                  className="form-control"
                  placeholder="e.g. bharath@gmail.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password * (min 6 chars)</label>
                <input
                  required
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="120"
                  className="form-control"
                  placeholder="e.g. 26"
                  value={regForm.age}
                  onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-control"
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select
                  className="form-control"
                  value={regForm.blood_group}
                  onChange={(e) => setRegForm({ ...regForm, blood_group: e.target.value })}
                >
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  placeholder="e.g. 9848022338"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  className="form-control"
                  placeholder="City, State"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Change Password Modal ─── */}
      {pwdModal && (
        <Modal
          title="Change Password"
          onClose={() => setPwdModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setPwdModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Updating…' : 'Save New Password'}
              </button>
            </>
          }
        >
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Update your account password securely.
            </p>

            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <input
                required
                type="password"
                className="form-control"
                placeholder="Enter your current password"
                value={pwdForm.current_password}
                onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password * (min 6 chars)</label>
              <input
                required
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                required
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={pwdForm.confirm_password}
                onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </header>
  );
}

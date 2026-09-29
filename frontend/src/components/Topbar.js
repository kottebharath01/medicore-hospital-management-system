import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../utils/api';
import Modal from './Modal';
import toast from 'react-hot-toast';

const titles = {
  '/': ['Dashboard', 'Live Hospital Operations'],
  '/departments': ['Departments', 'Clinical departments & specialties'],
  '/patients': ['Patients', 'Manage patient records'],
  '/doctors': ['Doctors', 'Medical staff directory'],
  '/appointments': ['Appointments', 'Schedule & track visits'],
  '/records': ['Medical Records', 'Patient history & diagnoses'],
  '/wards': ['Wards & Beds', 'Facility occupancy overview'],
  '/staff': ['Staff', 'Non-clinical personnel'],
};

export default function Topbar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [title, sub] = titles[loc.pathname] || ['MediCore', ''];
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const [pwdModal, setPwdModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Change password state
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

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
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  }

  const initials = user ? (user.name || user.username).slice(0, 2).toUpperCase() : 'GU';

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
        <p>
          {user
            ? `Welcome, ${user.name || user.username} • Role: ${user.role}${user.patient_code ? ` (Patient ID: ${user.patient_code})` : ''}`
            : `${sub}`}
        </p>
      </div>

      <div className="topbar-right">
        <span className="topbar-badge">{now}</span>

        {user && (
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

            <button className="btn-icon danger" title="Sign Out" onClick={handleLogout}>
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Change Password Modal ─── */}
      {pwdModal && (
        <Modal
          title="Change Password"
          onClose={() => setPwdModal(false)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setPwdModal(false)}>
                Cancel
              </button>
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

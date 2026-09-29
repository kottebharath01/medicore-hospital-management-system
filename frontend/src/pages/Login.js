import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../utils/api';
import {
  HeartPulse,
  Lock,
  User,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  KeyRound,
  Stethoscope,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'admin123', color: '#1a365d' },
  { label: 'Doctor', username: 'doctor', password: 'doctor123', color: '#00a99d' },
  { label: 'Nurse', username: 'nurse', password: 'nurse123', color: '#7c3aed' },
  { label: 'Receptionist', username: 'receptionist', password: 'receptionist123', color: '#d97706' },
  { label: 'Patient', username: 'patient', password: 'patient123', color: '#0284c7' },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Registration form state (Patients only)
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    gender: 'Male',
    blood_group: 'O+',
  });

  // Where to redirect after login
  const from = location.state?.from?.pathname || '/';

  // If already authenticated, redirect away from /login immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleLoginChange(e) {
    const { name, value } = e.target;
    setLoginForm((f) => ({ ...f, [name]: value }));
  }

  function handleRegChange(e) {
    const { name, value } = e.target;
    setRegForm((f) => ({ ...f, [name]: value }));
  }

  async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) {
      return toast.error('Please enter both username and password');
    }

    setLoading(true);
    try {
      const res = await loginUser(loginForm);
      const { token, user } = res.data;
      login(token, user);
      toast.success(res.data.message || `Welcome back, ${user.name || user.username}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.username.trim() || !regForm.email.trim() || !regForm.password) {
      return toast.error('Name, username, email, and password are required');
    }

    setLoading(true);
    try {
      const res = await registerUser(regForm);
      const { token, user } = res.data;
      login(token, user);
      toast.success(res.data.message || `Account created! Your Patient ID is ${user.code || 'PAT-0001'}`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  // Quick 1-click demo login
  async function handleDemoLogin(account) {
    setLoginForm({ username: account.username, password: account.password });
    setLoading(true);
    try {
      const res = await loginUser({ username: account.username, password: account.password });
      const { token, user } = res.data;
      login(token, user);
      toast.success(`Logged in as ${account.label} (${user.name})`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--navy), var(--teal))',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0, 169, 157, 0.25)',
              marginBottom: 12,
            }}
          >
            <HeartPulse size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--navy)' }}>
            <span style={{ color: 'var(--teal)' }}>Medi</span>Core
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
            Hospital Management System
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-main)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'login' ? '#fff' : 'transparent',
              color: mode === 'login' ? 'var(--navy)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
            onClick={() => setMode('login')}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: mode === 'register' ? '#fff' : 'transparent',
              color: mode === 'register' ? 'var(--navy)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
            onClick={() => setMode('register')}
          >
            <UserPlus size={14} /> Patient Signup
          </button>
        </div>

        {/* MODE 1: SIGN IN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} color="var(--text-muted)" /> Username or Email
              </label>
              <input
                className="form-control"
                type="text"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                placeholder="e.g. admin, doctor, or patient"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color="var(--text-muted)" /> Password
              </label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
              style={{ width: '100%', height: 42, fontSize: '0.92rem' }}
            >
              {loading ? 'Authenticating…' : (
                <>
                  Sign In <ArrowRight size={15} />
                </>
              )}
            </button>

            {/* Quick Demo Credentials */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <KeyRound size={13} /> 1-Click Role Login Demo:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => handleDemoLogin(acc)}
                    disabled={loading}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: acc.color,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = '#e2e8f0')}
                    onMouseLeave={(e) => (e.target.style.background = 'var(--bg-main)')}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* MODE 2: PATIENT REGISTRATION */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e0f2fe', borderRadius: 8, fontSize: '0.78rem', color: '#0369a1' }}>
              <strong>Public Registration:</strong> Self-registration creates a <strong>Patient</strong> account with a unique <code>PAT-xxxx</code> ID. Staff accounts are managed by administrators.
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Full Legal Name *</label>
              <input
                className="form-control"
                name="name"
                value={regForm.name}
                onChange={handleRegChange}
                placeholder="e.g. Johnathan Doe"
                required
              />
            </div>

            <div className="form-grid" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input
                  className="form-control"
                  type="number"
                  name="age"
                  min="0"
                  max="120"
                  value={regForm.age}
                  onChange={handleRegChange}
                  placeholder="e.g. 32"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-control" name="gender" value={regForm.gender} onChange={handleRegChange}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-control" name="blood_group" value={regForm.blood_group} onChange={handleRegChange}>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-control"
                  name="phone"
                  value={regForm.phone}
                  onChange={handleRegChange}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Email Address *</label>
              <input
                className="form-control"
                type="email"
                name="email"
                value={regForm.email}
                onChange={handleRegChange}
                placeholder="you@email.com"
                required
              />
            </div>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  className="form-control"
                  name="username"
                  value={regForm.username}
                  onChange={handleRegChange}
                  placeholder="choose username"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  className="form-control"
                  type="password"
                  name="password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  placeholder="min 6 chars"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
              style={{ width: '100%', height: 42, fontSize: '0.92rem' }}
            >
              {loading ? 'Creating Account…' : (
                <>
                  <UserPlus size={15} /> Create Patient Account
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

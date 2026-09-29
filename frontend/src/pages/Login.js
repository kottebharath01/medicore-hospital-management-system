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
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Manual login form state — no pre-filled credentials
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Patient registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
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
    const uname = loginForm.username.trim();
    const pwd = loginForm.password;

    if (!uname || !pwd) {
      return toast.error('Please enter both username/email and password');
    }

    setLoading(true);
    try {
      const res = await loginUser({ username: uname, password: pwd });
      const { token, user } = res.data;
      login(token, user);
      toast.success(res.data.message || `Welcome back, ${user.name || user.username}!`);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!regForm.name.trim()) return toast.error('Full legal name is required');
    if (!regForm.username.trim()) return toast.error('Username is required');
    if (!regForm.email.trim()) return toast.error('Email address is required');
    if (!regForm.password) return toast.error('Password is required');
    if (regForm.password.length < 6) return toast.error('Password must be at least 6 characters long');
    if (regForm.password !== regForm.confirm_password) {
      return toast.error('Passwords do not match. Please re-enter matching passwords.');
    }

    setLoading(true);
    try {
      const payload = {
        name: regForm.name.trim(),
        username: regForm.username.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        phone: regForm.phone.trim(),
        age: regForm.age ? parseInt(regForm.age, 10) : 30,
        gender: regForm.gender,
        blood_group: regForm.blood_group,
      };

      const res = await registerUser(payload);
      const { token, user } = res.data;
      login(token, user);
      toast.success(res.data.message || `Registration successful! Your Patient ID is ${user.code || 'PAT-0001'}`);
      navigate('/', { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Please check the entered details.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Hospital Branding Header */}
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

        {/* Tab Switcher: Sign In vs Patient Signup */}
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

        {/* ─── FORM 1: MANUAL SIGN IN ─── */}
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
                placeholder="Enter your username or email"
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
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
              style={{ width: '100%', height: 44, fontSize: '0.92rem' }}
            >
              {loading ? 'Verifying Credentials…' : (
                <>
                  Sign In <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── FORM 2: PATIENT REGISTRATION ─── */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: '#e0f2fe',
                borderRadius: 8,
                fontSize: '0.78rem',
                color: '#0369a1',
                lineHeight: 1.4,
              }}
            >
              <strong>Patient Registration:</strong> Create your patient portal account to schedule consultations, review medical records, and view prescriptions.
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Full Legal Name *</label>
              <input
                className="form-control"
                name="name"
                value={regForm.name}
                onChange={handleRegChange}
                placeholder="e.g. Rahul Sharma"
                required
                autoFocus
              />
            </div>

            <div className="form-grid" style={{ marginBottom: 14 }}>
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
                  placeholder="e.g. 29"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="form-control" name="gender" value={regForm.gender} onChange={handleRegChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-control" name="blood_group" value={regForm.blood_group} onChange={handleRegChange}>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
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

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email Address *</label>
              <input
                className="form-control"
                type="email"
                name="email"
                value={regForm.email}
                onChange={handleRegChange}
                placeholder="patient@email.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Username *</label>
              <input
                className="form-control"
                name="username"
                value={regForm.username}
                onChange={handleRegChange}
                placeholder="Choose a username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-grid" style={{ marginBottom: 18 }}>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  className="form-control"
                  type="password"
                  name="password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  placeholder="Min 6 characters"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  className="form-control"
                  type="password"
                  name="confirm_password"
                  value={regForm.confirm_password}
                  onChange={handleRegChange}
                  placeholder="Re-enter password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
              style={{ width: '100%', height: 44, fontSize: '0.92rem' }}
            >
              {loading ? 'Creating Patient Account…' : (
                <>
                  <UserPlus size={15} /> Register
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

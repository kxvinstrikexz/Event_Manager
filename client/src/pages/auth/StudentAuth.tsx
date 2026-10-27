import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const StudentAuth: React.FC<{ initialMode?: AuthMode }> = ({ initialMode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [mode, setMode] = useState<AuthMode>(tokenFromUrl ? 'reset' : initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState('3rd Year Undergraduate');
  const [phone, setPhone] = useState('');

  // Password reset state
  const [resetToken, setResetToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.studentLogin({ email, password });
      login(res.token, res.user);
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.studentRegister({
        email,
        password,
        fullName,
        studentId,
        department,
        academicYear,
        phone
      });
      login(res.token, res.user);
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email, role: 'student' });
      setSuccess(res.message);
      if (res.devResetToken) {
        setResetToken(res.devResetToken);
        setMode('reset');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await api.resetPassword({ token: resetToken, newPassword });
      setSuccess(res.message);
      setTimeout(() => {
        setMode('login');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 20px'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--dark-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.45 9L12 4.34 20.55 9 12 13.66 3.45 9zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            CampusEvents
          </span>
        </Link>
        <div style={{
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: 'var(--accent-base)'
        }}>
          STUDENT PORTAL
        </div>
      </div>

      {/* Auth Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: mode === 'register' ? '540px' : '440px',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-card)'
      }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-error-bg)',
            color: 'var(--status-error-text)',
            border: '1px solid var(--status-error-border)',
            fontSize: '0.8125rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success-text)',
            border: '1px solid var(--status-success-border)',
            fontSize: '0.8125rem',
            marginBottom: '20px'
          }}>
            {success}
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' && (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
              Log in to your account
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Welcome back. Sign in to continue to your campus events.
            </p>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="input-label">Student Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.chen@student.campusevents.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-base)', fontWeight: 600 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="divider" style={{ margin: '24px 0 16px' }} />

            <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('register'); setError(null); }}
                style={{ fontWeight: 600, color: 'var(--text-primary)' }}
              >
                Create Student Account
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.78125rem' }}>
              Are you faculty or staff?{' '}
              <Link to="/staff/login" style={{ color: 'var(--accent-base)', fontWeight: 600 }}>
                Go to Staff Portal &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Mode: Register */}
        {mode === 'register' && (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
              Create Student Account
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Register using your university student details.
            </p>

            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Chen"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Register Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CS2023-0482"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Student Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.chen@student.campusevents.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="input-field"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Eng.</option>
                    <option value="Mechanical & Aerospace Engineering">Mechanical & Aerospace</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Biotechnology & Life Sciences">Biotech & Life Sciences</option>
                    <option value="Architecture & Urban Design">Architecture & Design</option>
                    <option value="Business Administration">Business Administration</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="input-field"
                  >
                    <option value="1st Year Undergraduate">1st Year Undergraduate</option>
                    <option value="2nd Year Undergraduate">2nd Year Undergraduate</option>
                    <option value="3rd Year Undergraduate">3rd Year Undergraduate</option>
                    <option value="4th Year Undergraduate">4th Year Undergraduate</option>
                    <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                    <option value="Doctoral / PhD Scholar">Doctoral / PhD Scholar</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password (minimum 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Create a secure password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>

            <div className="divider" style={{ margin: '20px 0 14px' }} />

            <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <button
                onClick={() => { setMode('login'); setError(null); }}
                style={{ fontWeight: 600, color: 'var(--text-primary)' }}
              >
                Sign In to Portal
              </button>
            </div>
          </div>
        )}

        {/* Mode: Forgot Password */}
        {mode === 'forgot' && (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
              Reset Student Password
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Enter your registered student email address.
            </p>

            <form onSubmit={handleForgot}>
              <div className="input-group">
                <label className="input-label">Student Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.chen@student.campusevents.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Generating...' : 'Request Password Reset'}
              </button>
            </form>

            <div className="divider" style={{ margin: '20px 0 14px' }} />

            <div style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
              <button
                onClick={() => { setMode('login'); setError(null); }}
                style={{ color: 'var(--text-secondary)' }}
              >
                &larr; Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Mode: Reset Password */}
        {mode === 'reset' && (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
              Set New Password
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Enter your validation token and choose a new password.
            </p>

            <form onSubmit={handleReset}>
              <div className="input-group">
                <label className="input-label">Reset Token</label>
                <input
                  type="text"
                  required
                  placeholder="Paste reset token"
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">New Password (minimum 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>

            <div className="divider" style={{ margin: '20px 0 14px' }} />

            <div style={{ textAlign: 'center', fontSize: '0.8125rem' }}>
              <button
                onClick={() => { setMode('login'); setError(null); }}
                style={{ color: 'var(--text-secondary)' }}
              >
                &larr; Return to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

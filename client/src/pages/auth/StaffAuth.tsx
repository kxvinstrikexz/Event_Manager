import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify-otp';

export const StaffAuth: React.FC<{ initialMode?: AuthMode }> = ({ initialMode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [mode, setMode] = useState<AuthMode>(tokenFromUrl ? 'reset' : initialMode);
  const [officialEmail, setOfficialEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [departmentsList, setDepartmentsList] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [officeLocation, setOfficeLocation] = useState('');
  const [phone, setPhone] = useState('');

  // Fetch active departments from university directory
  useEffect(() => {
    api.getDepartments().then(res => {
      if (res?.departments && res.departments.length > 0) {
        setDepartmentsList(res.departments);
        setDepartment(prev => {
          const match = res.departments.find((d: any) => d.name === prev || d.code === prev);
          return match ? match.name : res.departments[0].name;
        });
      }
    }).catch(err => {
      console.warn('[StaffAuth] Could not load dynamic departments:', err);
    });
  }, []);

  // Email OTP verification state
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);

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
    setUnverifiedEmail(false);
    try {
      const res = await api.staffLogin({ officialEmail, password });
      login(res.token, res.user);
      navigate('/staff/dashboard');
    } catch (err: any) {
      if (err.data?.code === 'STAFF_EMAIL_UNVERIFIED') {
        setUnverifiedEmail(true);
      }
      setError(err.message || 'Staff authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.staffRegister({
        officialEmail,
        password,
        fullName,
        staffId,
        department,
        designation,
        officeLocation,
        phone
      });
      // CRITICAL: Pending staff must NOT receive login token or be logged in
      setMode('verify-otp');
      setSuccess(res.message || 'Registration submitted! Please verify your institutional email.');
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        setOtp(res.devOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Staff registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp({ email: officialEmail, otp });
      setSuccess(res.message || 'Institutional email verified! Your account is awaiting administrator approval before you can sign in.');
      setMode('login');
      setOtp('');
      setDevOtp(null);
      setUnverifiedEmail(false);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await api.resendOtp({ email: officialEmail });
      setSuccess(res.message);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        setOtp(res.devOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
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
      const res = await api.forgotPassword({ email: officialEmail, role: 'staff' });
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
          FACULTY & STAFF PORTAL
        </div>
      </div>

      {/* Auth Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: mode === 'register' ? '560px' : '440px',
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
              Faculty / Staff Sign In
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Access event management and attendance verification.
            </p>

            {unverifiedEmail && (
              <div style={{
                marginBottom: '18px',
                padding: '12px 14px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem'
              }}>
                <div style={{ marginBottom: '6px', fontWeight: 600, color: '#ca8a04' }}>
                  Institutional Email Pending Verification
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Please enter the 6-digit verification code to complete your email verification.
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('verify-otp'); setError(null); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78125rem', padding: '6px 14px' }}
                >
                  Enter Verification Code &rarr;
                </button>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="input-label">Official Staff Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. arthur.vance@campusevents.edu"
                  value={officialEmail}
                  onChange={e => setOfficialEmail(e.target.value)}
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
                  placeholder="Enter your account password"
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
              New faculty member?{' '}
              <button
                onClick={() => { setMode('register'); setError(null); }}
                style={{ fontWeight: 600, color: 'var(--text-primary)' }}
              >
                Submit Staff Registration
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.78125rem' }}>
              Are you a student?{' '}
              <Link to="/student/login" style={{ color: 'var(--accent-base)', fontWeight: 600 }}>
                Go to Student Portal &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Mode: Verify OTP */}
        {mode === 'verify-otp' && (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
              Verify Institutional Email
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              We have dispatched a 6-digit verification code to <strong>{officialEmail || 'your institutional email'}</strong>.
            </p>

            {devOtp && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                fontSize: '0.8125rem',
                color: 'var(--accent-base)',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Development OTP Code:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', letterSpacing: '0.15em' }}>{devOtp}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              {!officialEmail && (
                <div className="input-group">
                  <label className="input-label">Official University Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. elena.rostova@campusevents.edu"
                    value={officialEmail}
                    onChange={e => setOfficialEmail(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input-field"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.2rem',
                    letterSpacing: '0.25em',
                    textAlign: 'center'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Verifying Code...' : 'Verify Institutional Email'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{ fontSize: '0.8125rem', color: 'var(--accent-base)', fontWeight: 600 }}
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Mode: Register */}
        {mode === 'register' && (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
              Staff & Faculty Registration
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Registration creates an account with initial status <strong>PENDING</strong>, requiring administrative verification.
            </p>

            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-secondary-light)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78125rem',
              color: 'var(--text-secondary)',
              marginBottom: '20px'
            }}>
              Notice: You will be able to create events and verify student attendance once your credentials are confirmed by administration.
            </div>

            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Full Name & Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Elena Rostova"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Staff / Faculty ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC-ARCH-2094"
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Official University Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. elena.rostova@campusevents.edu"
                  value={officialEmail}
                  onChange={e => setOfficialEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Academic Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="input-field"
                    required
                  >
                    {departmentsList.length > 0 ? (
                      departmentsList.map(d => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.code})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                        <option value="Information Technology">Information Technology (IT)</option>
                        <option value="Electronics and Communication Engineering">Electronics and Communication Engineering (ECE)</option>
                        <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering (EEE)</option>
                        <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                        <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                        <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science (AIDS)</option>
                        <option value="Biotechnology & Life Sciences">Biotechnology & Life Sciences (BIOTECH)</option>
                        <option value="Architecture & Urban Design">Architecture & Urban Design (ARCH)</option>
                        <option value="Business Administration">Business Administration (MGMT)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Designation</label>
                  <select
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="input-field"
                  >
                    <option value="Professor & Program Chair">Professor & Program Chair</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Head of Department">Head of Department</option>
                    <option value="Dean of Student Affairs">Dean of Student Affairs</option>
                    <option value="Program Coordinator">Program Coordinator</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Office / Studio Location</label>
                <input
                  type="text"
                  placeholder="e.g. Design Studio B-12"
                  value={officeLocation}
                  onChange={e => setOfficeLocation(e.target.value)}
                  className="input-field"
                />
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
                {loading ? 'Submitting Application...' : 'Submit Staff Registration'}
              </button>
            </form>

            <div className="divider" style={{ margin: '20px 0 14px' }} />

            <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Already approved?{' '}
              <button
                onClick={() => { setMode('login'); setError(null); }}
                style={{ fontWeight: 600, color: 'var(--text-primary)' }}
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Mode: Forgot Password */}
        {mode === 'forgot' && (
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
              Reset Faculty Password
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Enter your official university staff email.
            </p>

            <form onSubmit={handleForgot}>
              <div className="input-group">
                <label className="input-label">Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. arthur.vance@campusevents.edu"
                  value={officialEmail}
                  onChange={e => setOfficialEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? 'Processing...' : 'Request Password Reset'}
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
              Set New Faculty Password
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Enter your reset verification token.
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

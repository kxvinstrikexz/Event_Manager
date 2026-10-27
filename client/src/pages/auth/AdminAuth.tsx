import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

export const AdminAuth: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.adminLogin({ username, password });
      login(res.token, res.user);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
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
          color: 'var(--dark-base)'
        }}>
          CENTRAL ADMINISTRATION
        </div>
      </div>

      {/* Admin Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '420px',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
          Operations Access
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Authorized university administrative personnel only.
        </p>

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

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Admin Username</label>
            <input
              type="text"
              required
              placeholder="e.g. admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              required
              placeholder="Enter institutional administrative password"
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
            {loading ? 'Authenticating...' : 'Sign In to Operations'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0 16px' }} />

        <div style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5
        }}>
          Notice: Public registration and self-service password reset are disabled for institutional security compliance.
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78125rem' }}>
          <Link to="/" style={{ color: 'var(--accent-base)', fontWeight: 600 }}>
            &larr; Return to Gateway
          </Link>
        </div>
      </div>
    </div>
  );
};

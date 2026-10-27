import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Administrator credentials updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update administrator password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Administrator Account Settings
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Manage your operations credentials, access tokens, and administrative security parameters.
        </p>
      </div>

      <div className="panel" style={{ marginBottom: '28px' }}>
        <div className="panel-header">
          <h2 className="panel-title">Institutional Account Details</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.875rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Username</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {user?.username || 'admin'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Role Clearance</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Institutional Administrator (Full Access)
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Security Policy</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Strict PBKDF2/Bcrypt Key Derivation Active
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Registration Policy</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Public Administration Registration Disabled
            </div>
          </div>
        </div>
      </div>

      {/* Password update */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Update Administrator Password</h2>
        </div>

        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
            color: message.type === 'success' ? 'var(--status-success-text)' : 'var(--status-error-text)',
            border: `1px solid ${message.type === 'success' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
            fontSize: '0.8125rem',
            marginBottom: '20px'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="input-group">
            <label className="input-label">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">New Administrator Password (minimum 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Updating Credentials...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

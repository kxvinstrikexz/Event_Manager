import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

export const StaffProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [department, setDepartment] = useState(user?.profile?.department || 'Computer Science & Engineering');
  const [designation, setDesignation] = useState(user?.profile?.designation || 'Associate Professor');
  const [officeLocation, setOfficeLocation] = useState(user?.profile?.office_location || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await api.updateProfile({
        fullName,
        department,
        designation,
        officeLocation,
        phone
      });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Faculty profile updated successfully.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setSavingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Account password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Faculty &amp; Staff Academic Profile
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Manage your official university credentials, departmental designation, and account security.
        </p>
      </div>

      {/* Profile Form Panel */}
      <div className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-header">
          <h2 className="panel-title">Official Credentials</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Official Email: {user?.email} &bull; Staff ID: {user?.profile?.staff_id}
          </span>
        </div>

        {profileMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: profileMsg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
            color: profileMsg.type === 'success' ? 'var(--status-success-text)' : 'var(--status-error-text)',
            border: `1px solid ${profileMsg.type === 'success' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
            fontSize: '0.8125rem',
            marginBottom: '20px'
          }}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Full Name &amp; Title</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Academic Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Office / Studio Location</label>
              <input
                type="text"
                value={officeLocation}
                onChange={e => setOfficeLocation(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Office Phone Contact</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Security Panel */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Security &amp; Password Settings</h2>
        </div>

        {passwordMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: passwordMsg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
            color: passwordMsg.type === 'success' ? 'var(--status-success-text)' : 'var(--status-error-text)',
            border: `1px solid ${passwordMsg.type === 'success' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
            fontSize: '0.8125rem',
            marginBottom: '20px'
          }}>
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              <label className="input-label">New Password (minimum 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={savingPassword}
              className="btn btn-secondary"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

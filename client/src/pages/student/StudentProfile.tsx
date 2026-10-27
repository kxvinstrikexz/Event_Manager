import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

export const StudentProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [studentId, setStudentId] = useState(user?.profile?.student_id || '');
  const [department, setDepartment] = useState(user?.profile?.department || 'Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState(user?.profile?.academic_year || '3rd Year Undergraduate');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');

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
        studentId,
        department,
        academicYear,
        phone,
        bio
      });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Student profile updated successfully.' });
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
          Student Academic Profile
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Manage your collegiate credentials, enrollment details, and institutional account security.
        </p>
      </div>

      {/* Profile Form Panel */}
      <div className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-header">
          <h2 className="panel-title">Institutional Information</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Email: {user?.email}</span>
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
              <label className="input-label">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Register / Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="input-field"
                placeholder="e.g. CS2023-0482"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Academic Department</label>
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
            <label className="input-label">Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input-field"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Academic Bio / Research Specialization</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="input-field"
              placeholder="Brief summary of your academic interests..."
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

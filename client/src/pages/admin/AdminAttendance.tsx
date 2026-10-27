import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const AdminAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getAllAttendance({ search: search.trim() || undefined });
      setAttendance(res.attendance || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Platform Attendance Audit Logs
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Verified on-site check-in logs with verification timestamps, methods, and authorized verifier identities.
        </p>
      </div>

      {/* Filter */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchAttendance(); }} style={{ display: 'flex', gap: '8px', maxWidth: '380px', width: '100%' }}>
          <input
            type="text"
            placeholder="Search by student, event, or ticket code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ height: '38px', fontSize: '0.84375rem' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ height: '38px' }}>
            Filter
          </button>
        </form>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Verified Records: <strong>{attendance.length}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading attendance logs...
        </div>
      ) : attendance.length === 0 ? (
        <EmptyState
          title="No verified attendance records"
          description="Verified attendee check-ins will appear here once recorded by faculty or administrators."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Student ID</th>
                <th>Event Title</th>
                <th>Ticket Code</th>
                <th>Verified Timestamp</th>
                <th>Verified By</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(att => (
                <tr key={att.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {att.student_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {att.student_email}
                    </div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)' }}>{att.student_register_number || '—'}</td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{att.event_title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{att.event_venue}</div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{att.ticket_code}</td>

                  <td style={{ fontSize: '0.8125rem' }}>
                    {att.verified_at}
                  </td>

                  <td style={{ fontSize: '0.8125rem' }}>
                    {att.verifier_name}
                  </td>

                  <td>
                    <span className="badge badge-active">
                      {att.verification_method}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

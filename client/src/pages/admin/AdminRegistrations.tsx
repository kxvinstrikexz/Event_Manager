import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const AdminRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.getAllRegistrations({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setRegistrations(res.registrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          University Registration Records
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Comprehensive ledger of student event enrollments, issued digital ticket serials, and check-in statuses.
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
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchRegistrations(); }} style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search by student, ticket code, or event title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ height: '38px', fontSize: '0.84375rem' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ height: '38px' }}>
            Filter
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label className="input-label" style={{ margin: 0 }}>Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ height: '38px', width: 'auto' }}
          >
            <option value="all">All Statuses</option>
            <option value="registered">Registered</option>
            <option value="attended">Attended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading registration ledger...
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState
          title="No registrations found"
          description="Student enrollments across all faculties will be listed here."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID &amp; Dept</th>
                <th>Event Title</th>
                <th>Ticket Code</th>
                <th>Registered Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.student_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.student_email}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{r.student_register_number || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.student_department}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{r.event_title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.event_date}</div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {r.ticket_code}
                  </td>

                  <td style={{ fontSize: '0.8125rem' }}>
                    {r.registered_at?.split(' ')[0] || r.registered_at}
                  </td>

                  <td>
                    <span className={`badge badge-${r.status}`}>
                      {r.status}
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

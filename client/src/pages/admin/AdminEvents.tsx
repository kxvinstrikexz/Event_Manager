import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateEvent(id, { status: newStatus });
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to update event status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete event "${title}"?`)) return;
    try {
      await api.deleteEvent(id);
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Platform Event Registry
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Audit all campus events, toggle institutional publication status, and oversee capacity allocation.
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
        <form onSubmit={(e) => { e.preventDefault(); fetchEvents(); }} style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Search by title, organizer, or venue..."
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading events registry...
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events in registry"
          description="Events published by faculty or staff will appear here."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Event Title &amp; Category</th>
                <th>Date &amp; Venue</th>
                <th>Organizer</th>
                <th>Enrollments</th>
                <th>Status</th>
                <th>Status Override</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-base)', textTransform: 'uppercase' }}>
                      {ev.category}
                    </div>
                  </td>

                  <td>
                    <div>{ev.date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.venue}</div>
                  </td>

                  <td style={{ fontSize: '0.8125rem' }}>
                    {ev.organizer_name}
                  </td>

                  <td>
                    <strong>{ev.registered_count}</strong> / {ev.max_participants}
                    <div style={{ fontSize: '0.72rem', color: 'var(--status-success-text)' }}>
                      {ev.attendance_count} attended
                    </div>
                  </td>

                  <td>
                    <span className={`badge badge-${ev.status}`}>
                      {ev.status}
                    </span>
                  </td>

                  <td>
                    <select
                      value={ev.status}
                      onChange={e => handleStatusChange(ev.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-strong)',
                        backgroundColor: 'var(--bg-surface)'
                      }}
                    >
                      <option value="published">published</option>
                      <option value="draft">draft</option>
                      <option value="closed">closed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>

                  <td>
                    <button
                      onClick={() => handleDelete(ev.id, ev.title)}
                      className="btn btn-danger"
                      style={{ height: '26px', padding: '0 8px', fontSize: '0.7rem' }}
                    >
                      Delete
                    </button>
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StaffEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getMyStaffEvents();
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteEvent(id);
      fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event.');
    }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Event Management Roster
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Author, edit, and oversee events registered under your academic authority.
          </p>
        </div>

        <Link to="/staff/events/create" className="btn btn-primary" style={{ height: '38px', fontSize: '0.8125rem' }}>
          + Create New Event
        </Link>
      </div>

      {/* Filter */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <input
          type="text"
          placeholder="Filter events by title or venue..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ maxWidth: '340px', height: '36px', fontSize: '0.84375rem' }}
        />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Total Events: <strong>{filtered.length}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving faculty events...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No events found"
          description={search ? 'No events matched your search query.' : 'You have not created any events yet.'}
          actionText="Create Event"
          onAction={() => window.location.href = '/staff/events/create'}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Event Title &amp; Category</th>
                <th>Date &amp; Venue</th>
                <th>Enrolled</th>
                <th>Attendance</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(evt => (
                <tr key={evt.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link to={`/staff/events/${evt.id}`}>{evt.title}</Link>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-base)', textTransform: 'uppercase' }}>
                      {evt.category}
                    </div>
                  </td>

                  <td>
                    <div>{evt.date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.venue}</div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600 }}>{evt.registered_count}</span> / {evt.max_participants}
                  </td>

                  <td>
                    <span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>
                      {evt.attendance_count}
                    </span>
                  </td>

                  <td>
                    {evt.average_rating ? `${evt.average_rating} ★` : '—'}
                  </td>

                  <td>
                    <span className={`badge badge-${evt.status}`}>
                      {evt.status}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/staff/events/${evt.id}`}
                        className="btn btn-outline"
                        style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                      >
                        Manage
                      </Link>
                      <Link
                        to={`/staff/events/${evt.id}/edit`}
                        className="btn btn-secondary"
                        style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(evt.id, evt.title)}
                        className="btn btn-danger"
                        style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                      >
                        Delete
                      </button>
                    </div>
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

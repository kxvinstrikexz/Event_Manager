import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffData = async () => {
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
    fetchStaffData();
  }, []);

  const totalEvents = events.length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendance_count || 0), 0);
  const avgRatingEvents = events.filter(e => e.average_rating !== null);
  const avgPlatformRating = avgRatingEvents.length > 0
    ? (avgRatingEvents.reduce((sum, e) => sum + e.average_rating, 0) / avgRatingEvents.length).toFixed(1)
    : 'N/A';

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
            color: 'var(--accent-base)',
            marginBottom: '4px'
          }}>
            Faculty &amp; Staff Operations
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {user?.profile?.full_name || 'Faculty Member'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {user?.profile?.designation} &bull; {user?.profile?.department} &bull; Staff ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{user?.profile?.staff_id}</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/staff/attendance" className="btn btn-secondary" style={{ height: '38px', fontSize: '0.8125rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            </svg>
            Verify Attendance
          </Link>
          <Link to="/staff/events/create" className="btn btn-primary" style={{ height: '38px', fontSize: '0.8125rem' }}>
            + Create Event
          </Link>
        </div>
      </div>

      {/* Operational Metrics Bar (Clean, institutional, no tacky gradient cards) */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '24px',
        marginBottom: '36px'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            Organized Events
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {totalEvents}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            Total Registrations
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {totalRegistrations}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            Verified Attendance
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--status-success-text)', marginTop: '2px' }}>
            {totalAttendees}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            Session Rating Avg
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {avgPlatformRating} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
        </div>
      </div>

      {/* My Managed Events Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Managed Departmental Events
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Symposia and workshops organized under your institutional account.
            </p>
          </div>
          <Link to="/staff/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-base)' }}>
            Manage all events &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading faculty records...
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="No events organized yet"
            description="Create your first department event to begin accepting student enrollments and generating digital passes."
            actionText="Create New Event"
            onAction={() => window.location.href = '/staff/events/create'}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title &amp; Discipline</th>
                  <th>Date &amp; Time</th>
                  <th>Capacity</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(evt => (
                  <tr key={evt.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Link to={`/staff/events/${evt.id}`}>
                          {evt.title}
                        </Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {evt.category} &bull; {evt.venue}
                      </div>
                    </td>

                    <td>
                      <div>{evt.date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {evt.start_time} - {evt.end_time}
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>{evt.registered_count}</strong> / {evt.max_participants}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {Math.max(0, evt.max_participants - evt.registered_count)} open
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--status-success-text)' }}>
                        {evt.attendance_count} verified
                      </div>
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
                          Roster
                        </Link>
                        <Link
                          to={`/staff/events/${evt.id}/edit`}
                          className="btn btn-secondary"
                          style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

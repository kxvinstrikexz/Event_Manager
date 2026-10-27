import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { TicketPassModal } from '../../components/ui/TicketPassModal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pass modal state
  const [passData, setPassData] = useState<any | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [regRes, evtRes, certRes] = await Promise.all([
          api.getMyRegistrations(),
          api.getEvents({ dateFilter: 'upcoming', status: 'published' }),
          api.getMyCertificates()
        ]);
        setRegistrations(regRes.registrations || []);
        setUpcomingEvents((evtRes.events || []).slice(0, 4));
        setCertificates(certRes.certificates || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openPass = async (regId: string) => {
    try {
      const data = await api.getPass(regId);
      setPassData(data);
      setIsPassModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const nextRegistration = registrations.find(r => r.status === 'registered');

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 700,
          color: 'var(--accent-base)',
          marginBottom: '6px'
        }}>
          Undergraduate Portal • {user?.profile?.department || 'University Student'}
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Welcome, {user?.profile?.full_name || 'Scholar'}
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Student ID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{user?.profile?.student_id || 'Not Assigned'}</strong> &bull; Registered for <strong>{registrations.length}</strong> event(s) &bull; <strong>{certificates.length}</strong> official certificate(s) conferred.
        </p>
      </div>

      {/* Active Pass Banner / Upcoming Participation Priority */}
      {nextRegistration ? (
        <div style={{
          backgroundColor: 'var(--bg-secondary-light)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '36px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--status-success-text)',
              marginBottom: '8px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--status-success-text)' }} />
              Active Confirmed Pass
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {nextRegistration.event_title}
            </h2>
            <div style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
              {nextRegistration.event_date} at {nextRegistration.event_start_time} &bull; {nextRegistration.event_venue}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ticket Serial</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.875rem' }}>
                {nextRegistration.ticket_code}
              </div>
            </div>
            <button
              onClick={() => openPass(nextRegistration.id)}
              className="btn btn-primary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              View QR Pass
            </button>
          </div>
        </div>
      ) : null}

      {/* Main Sections: Discover Events & Recent Registrations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        {/* Section 1: Upcoming Campus Events */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Upcoming Campus Events
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Open registrations across all academic disciplines.
              </p>
            </div>
            <Link to="/student/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-base)' }}>
              View all &rarr;
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading upcoming schedule...
            </div>
          ) : upcomingEvents.length === 0 ? (
            <EmptyState
              title="No upcoming events scheduled"
              description="New university symposiums, lectures, and workshops will appear here when announced by faculty."
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)'
            }}>
              {upcomingEvents.map((evt, idx) => (
                <div
                  key={evt.id}
                  style={{
                    padding: '20px 24px',
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr auto',
                    alignItems: 'center',
                    gap: '20px',
                    borderBottom: idx < upcomingEvents.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {evt.date}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {evt.start_time}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-base)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {evt.category}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 4px' }}>
                      {evt.title}
                    </h3>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Venue: {evt.venue} &bull; Organizer: {evt.organizer_name}
                    </div>
                  </div>

                  <div>
                    <Link to={`/student/events/${evt.id}`} className="btn btn-outline" style={{ height: '34px', fontSize: '0.78125rem' }}>
                      Details &amp; Register &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Recent Registrations Overview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Your Event History
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Recent registrations and attendance confirmation records.
              </p>
            </div>
            <Link to="/student/registrations" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-base)' }}>
              All registrations &rarr;
            </Link>
          </div>

          {registrations.length === 0 ? (
            <EmptyState
              title="No registrations on file"
              description="Browse the university calendar to register for upcoming guest lectures and symposia."
              actionText="Browse Events"
              onAction={() => window.location.href = '/student/events'}
            />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date & Venue</th>
                    <th>Ticket Code</th>
                    <th>Status</th>
                    <th>Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.slice(0, 5).map(reg => (
                    <tr key={reg.id}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{reg.event_title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reg.event_category}</div>
                      </td>
                      <td>
                        <div>{reg.event_date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reg.event_venue}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{reg.ticket_code}</td>
                      <td>
                        <span className={`badge badge-${reg.status}`}>
                          {reg.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => openPass(reg.id)}
                          className="btn btn-outline"
                          style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
                        >
                          Pass
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <TicketPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        passData={passData}
      />
    </div>
  );
};

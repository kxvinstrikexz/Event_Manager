import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { TicketPassModal } from '../../components/ui/TicketPassModal.js';

export const StudentEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ticket pass modal state
  const [passData, setPassData] = useState<any | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getEvent(id);
      setEvent(res.event);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!id) return;
    if (!user) {
      navigate('/student/login');
      return;
    }
    setError(null);
    setRegistering(true);
    try {
      const res = await api.registerForEvent(id);
      setSuccess('You have successfully registered! Your official event pass is ready.');
      setPassData({
        registration: res.registration,
        event: event,
        qrDataUrl: res.qrDataUrl
      });
      setIsPassModalOpen(true);
      fetchEvent();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const handleOpenExistingPass = async () => {
    try {
      const myRegs = await api.getMyRegistrations();
      const currentReg = (myRegs.registrations || []).find((r: any) => r.event_id === id && r.status !== 'cancelled');
      if (currentReg) {
        const passRes = await api.getPass(currentReg.id);
        setPassData(passRes);
        setIsPassModalOpen(true);
      }
    } catch (err: any) {
      setError('Could not retrieve existing event pass.');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '880px', margin: '40px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Retrieving official event catalog record...
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Event Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          This event may have been unpublished or removed.
        </p>
        <Link to="/student/events" className="btn btn-primary">
          Back to Events
        </Link>
      </div>
    );
  }

  const seatsRemaining = Math.max(0, event.max_participants - (event.registered_count || 0));
  const isFull = seatsRemaining <= 0;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px', fontSize: '0.8125rem' }}>
        <Link to="/student/events" style={{ color: 'var(--text-muted)' }}>
          &larr; Campus Events Calendar
        </Link>
        <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{event.category}</span>
      </div>

      {/* Main Editorial Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
        {/* Poster Header if available */}
        {event.poster_url && (
          <div style={{
            width: '100%',
            height: '240px',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-secondary)',
            position: 'relative'
          }}>
            <img
              src={event.poster_url}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(42, 62, 75, 0.4), transparent)'
            }} />
          </div>
        )}

        {/* Content Container */}
        <div style={{ padding: '36px 40px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-error-bg)',
              color: 'var(--status-error-text)',
              border: '1px solid var(--status-error-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84375rem',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success-text)',
              border: '1px solid var(--status-success-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84375rem',
              marginBottom: '24px'
            }}>
              {success}
            </div>
          )}

          {/* Category & Title */}
          <div style={{
            fontSize: '0.78125rem',
            color: 'var(--accent-base)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '6px'
          }}>
            {event.category}
          </div>

          <h1 style={{
            fontSize: '1.95rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.25,
            marginBottom: '24px'
          }}>
            {event.title}
          </h1>

          {/* Key Schedule & Venue Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            padding: '20px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '32px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.date}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session Hours</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.start_time} - {event.end_time}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Campus Venue</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.venue}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Organizer</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.organizer_name}
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '10px' }}>
              Event Overview
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {event.description}
            </p>
          </div>

          {/* Institutional Guidelines */}
          {event.guidelines && (
            <div style={{
              marginBottom: '36px',
              padding: '20px 24px',
              backgroundColor: 'var(--bg-secondary-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Participation Guidelines &amp; Requirements
              </h4>
              <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {event.guidelines}
              </p>
            </div>
          )}

          <div className="divider" />

          {/* Registration Action Section */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Capacity Status
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.registered_count} registered of {event.max_participants} capacity
                <span style={{ color: seatsRemaining <= 10 ? 'var(--status-error-text)' : 'var(--text-secondary)', marginLeft: '6px' }}>
                  ({seatsRemaining} seats available)
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Registration window: {event.registration_start} to {event.registration_end}
              </div>
            </div>

            <div>
              {event.is_user_registered ? (
                <button
                  onClick={handleOpenExistingPass}
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 24px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  View Your Digital Event Pass
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || isFull || event.status !== 'published'}
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 28px' }}
                >
                  {registering
                    ? 'Processing Enrollment...'
                    : isFull
                    ? 'Registration Full'
                    : 'Register for Event'}
                </button>
              )}
            </div>
          </div>
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

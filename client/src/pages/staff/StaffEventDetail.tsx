import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StaffEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'feedback'>('roster');
  const [loading, setLoading] = useState(true);

  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [evtRes, regRes, fbRes] = await Promise.all([
        api.getEvent(id),
        api.getEventRegistrations(id),
        api.getEventFeedback(id)
      ]);
      setEvent(evtRes.event);
      setRegistrations(regRes.registrations || []);
      setFeedback(fbRes.feedback || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleBulkIssueCertificates = async () => {
    if (!id) return;
    if (!window.confirm('Issue official participation certificates to all verified attendees of this event?')) {
      return;
    }
    setBulkIssuing(true);
    setBulkMessage(null);
    try {
      const res = await api.bulkIssueCertificates(id);
      setBulkMessage(res.message);
      fetchDetails();
    } catch (err: any) {
      setBulkMessage('Failed: ' + (err.message || 'Error issuing certificates'));
    } finally {
      setBulkIssuing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Retrieving event roster and feedback records...
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <h2>Event not found</h2>
        <Link to="/staff/events" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Events
        </Link>
      </div>
    );
  }

  const attendedCount = registrations.filter(r => r.status === 'attended').length;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/staff/events" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          &larr; Back to Events Roster
        </Link>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginTop: '8px'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-base)', fontWeight: 700, textTransform: 'uppercase' }}>
              {event.category} &bull; Status: <span style={{ textTransform: 'uppercase' }}>{event.status}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
              {event.title}
            </h1>
            <div style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
              {event.date} ({event.start_time} - {event.end_time}) &bull; {event.venue}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/staff/attendance?eventId=${event.id}`} className="btn btn-secondary" style={{ height: '36px', fontSize: '0.8125rem' }}>
              Scan QR Attendance
            </Link>
            <Link to={`/staff/events/${event.id}/edit`} className="btn btn-outline" style={{ height: '36px', fontSize: '0.8125rem' }}>
              Edit Event
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Students</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {registrations.length} / {event.max_participants}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Attendance</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--status-success-text)' }}>
            {attendedCount}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendee Feedback Count</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {feedback.length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Review</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {event.average_rating ? `${event.average_rating} ★` : '—'}
          </div>
        </div>
      </div>

      {bulkMessage && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary-light)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.84375rem',
          color: 'var(--text-primary)',
          marginBottom: '20px'
        }}>
          {bulkMessage}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={() => setActiveTab('roster')}
            style={{
              padding: '10px 0',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'roster' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: '2px solid',
              borderColor: activeTab === 'roster' ? 'var(--dark-base)' : 'transparent'
            }}
          >
            Registered Attendees ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '10px 0',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'feedback' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: '2px solid',
              borderColor: activeTab === 'feedback' ? 'var(--dark-base)' : 'transparent'
            }}
          >
            Session Feedback ({feedback.length})
          </button>
        </div>

        {activeTab === 'roster' && (
          <button
            onClick={handleBulkIssueCertificates}
            disabled={bulkIssuing || attendedCount === 0}
            className="btn btn-secondary"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            {bulkIssuing ? 'Generating Certificates...' : `Issue Certificates to ${attendedCount} Attendees`}
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'roster' ? (
        registrations.length === 0 ? (
          <EmptyState
            title="No registrations for this event yet"
            description="Students enrolled through the portal will appear in this roster."
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Department</th>
                  <th>Ticket Code</th>
                  <th>Registered At</th>
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
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.student_register_number || '—'}</td>
                    <td>{r.student_department || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.ticket_code}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{r.registered_at?.split(' ')[0] || r.registered_at}</td>
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
        )
      ) : (
        feedback.length === 0 ? (
          <EmptyState
            title="No feedback submitted yet"
            description="Attendees can submit ratings and session reviews after their attendance has been verified."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {feedback.map(fb => (
              <div
                key={fb.id}
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                    {fb.student_name} <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 400 }}>({fb.student_department})</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)} ({fb.rating}/5)
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  "{fb.comments}"
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Submitted on {fb.created_at?.split(' ')[0] || fb.created_at}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

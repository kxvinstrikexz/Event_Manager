import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StaffFeedback: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyStaffEvents()
      .then(res => {
        const evts = res.events || [];
        setEvents(evts);
        if (evts.length > 0) {
          setSelectedEventId(evts[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setLoading(true);
      api.getEventFeedback(selectedEventId)
        .then(res => setFeedback(res.feedback || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedEventId]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Session Evaluations &amp; Feedback
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Review attendee evaluations, ratings, and commentary for your organized events.
        </p>
      </div>

      {/* Event Selector */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <label className="input-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
          Select Event:
        </label>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="input-field"
          style={{ height: '38px', maxWidth: '420px', fontSize: '0.875rem' }}
        >
          {events.map(e => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.date})
            </option>
          ))}
        </select>
      </div>

      {/* Feedback stream */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving session feedback...
        </div>
      ) : feedback.length === 0 ? (
        <EmptyState
          title="No evaluations submitted yet"
          description="Verified attendees can submit post-event ratings and feedback for this session."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {feedback.map(fb => (
            <div
              key={fb.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                  {fb.student_name}
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '8px' }}>
                    ({fb.student_department || 'General Student'})
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)} ({fb.rating}/5)
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                "{fb.comments}"
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Conferred on {fb.created_at?.split(' ')[0] || fb.created_at}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

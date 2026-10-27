import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const AdminFeedback: React.FC = () => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.getAllFeedback({ search: search.trim() || undefined });
      setFeedback(res.feedback || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Platform-Wide Feedback &amp; Evaluations
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Audit student evaluations, satisfaction ratings, and qualitative comments across all institutional sessions.
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
        <form onSubmit={(e) => { e.preventDefault(); fetchFeedback(); }} style={{ display: 'flex', gap: '8px', maxWidth: '380px', width: '100%' }}>
          <input
            type="text"
            placeholder="Search comments or event titles..."
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
          Total Evaluations: <strong>{feedback.length}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading feedback records...
        </div>
      ) : feedback.length === 0 ? (
        <EmptyState
          title="No evaluations submitted yet"
          description="Submitted evaluations from verified attendees will appear here."
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
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{fb.event_title}</strong>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                    Reviewed by {fb.student_name} ({fb.student_department || 'Student'})
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
                Recorded on {fb.created_at}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

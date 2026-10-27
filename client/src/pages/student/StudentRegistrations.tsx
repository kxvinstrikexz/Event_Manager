import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { TicketPassModal } from '../../components/ui/TicketPassModal.js';
import { Modal } from '../../components/ui/Modal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StudentRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'registered' | 'attended' | 'cancelled'>('registered');
  const [loading, setLoading] = useState(true);

  // Pass modal
  const [passData, setPassData] = useState<any | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Feedback modal
  const [feedbackEvent, setFeedbackEvent] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.getMyRegistrations();
      setRegistrations(res.registrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
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

  const handleCancel = async (regId: string) => {
    if (!window.confirm('Are you sure you wish to cancel this event enrollment? Your seat will be released.')) {
      return;
    }
    try {
      await api.cancelRegistration(regId);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration.');
    }
  };

  const handleOpenFeedback = (reg: any) => {
    setFeedbackEvent(reg);
    setRating(5);
    setComments('');
    setFeedbackStatus(null);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackEvent) return;
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback({
        eventId: feedbackEvent.event_id,
        rating,
        comments
      });
      setFeedbackStatus('Thank you! Your feedback has been recorded.');
      setTimeout(() => {
        setFeedbackEvent(null);
      }, 1500);
    } catch (err: any) {
      setFeedbackStatus('Error: ' + (err.message || 'Could not submit feedback.'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filtered = registrations.filter(r => r.status === activeTab);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          My Registrations &amp; Event Passes
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Manage your confirmed event passes, verified attendance logs, and post-session evaluations.
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '24px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('registered')}
          style={{
            padding: '12px 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'registered' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: '2px solid',
            borderColor: activeTab === 'registered' ? 'var(--dark-base)' : 'transparent',
            transition: 'color var(--trans-fast)'
          }}
        >
          Upcoming ({registrations.filter(r => r.status === 'registered').length})
        </button>
        <button
          onClick={() => setActiveTab('attended')}
          style={{
            padding: '12px 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'attended' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: '2px solid',
            borderColor: activeTab === 'attended' ? 'var(--dark-base)' : 'transparent',
            transition: 'color var(--trans-fast)'
          }}
        >
          Attended ({registrations.filter(r => r.status === 'attended').length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{
            padding: '12px 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'cancelled' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: '2px solid',
            borderColor: activeTab === 'cancelled' ? 'var(--dark-base)' : 'transparent',
            transition: 'color var(--trans-fast)'
          }}
        >
          Cancelled ({registrations.filter(r => r.status === 'cancelled').length})
        </button>
      </div>

      {/* List / Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading participation logs...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} registrations`}
          description={
            activeTab === 'registered'
              ? 'You have no pending event passes. Browse upcoming events to register.'
              : activeTab === 'attended'
              ? 'Attendance is verified on-site by faculty or administrators scanning your pass.'
              : 'You have no cancelled registrations.'
          }
          actionText={activeTab === 'registered' ? 'Browse Events' : undefined}
          onAction={() => window.location.href = '/student/events'}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Event &amp; Category</th>
                <th>Date &amp; Venue</th>
                <th>Ticket Code</th>
                <th>Registered Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(reg => (
                <tr key={reg.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link to={`/student/events/${reg.event_id}`}>
                        {reg.event_title}
                      </Link>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-base)', textTransform: 'uppercase' }}>
                      {reg.event_category}
                    </div>
                  </td>

                  <td>
                    <div>{reg.event_date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {reg.event_start_time} - {reg.event_venue}
                    </div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {reg.ticket_code}
                  </td>

                  <td style={{ fontSize: '0.8125rem' }}>
                    {reg.registered_at?.split(' ')[0] || reg.registered_at}
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {reg.status !== 'cancelled' && (
                        <button
                          onClick={() => openPass(reg.id)}
                          className="btn btn-outline"
                          style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                        >
                          View Pass
                        </button>
                      )}

                      {reg.status === 'registered' && (
                        <button
                          onClick={() => handleCancel(reg.id)}
                          className="btn btn-danger"
                          style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      )}

                      {reg.status === 'attended' && (
                        <button
                          onClick={() => handleOpenFeedback(reg)}
                          className="btn btn-secondary"
                          style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                        >
                          Feedback
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Pass Modal */}
      <TicketPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        passData={passData}
      />

      {/* Feedback Submission Modal */}
      {feedbackEvent && (
        <Modal
          isOpen={!!feedbackEvent}
          onClose={() => setFeedbackEvent(null)}
          title={`Submit Feedback: ${feedbackEvent.event_title}`}
          maxWidth="500px"
        >
          {feedbackStatus ? (
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary-light)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              textAlign: 'center'
            }}>
              {feedbackStatus}
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback}>
              <div className="input-group">
                <label className="input-label">Academic Rating (1 to 5 Stars)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        width: '42px',
                        height: '38px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: rating >= star ? 'var(--dark-base)' : 'var(--bg-secondary)',
                        color: rating >= star ? '#FFFFFF' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Comments &amp; Evaluation</label>
                <textarea
                  required
                  placeholder="Share feedback on the session organization, speakers, and relevance to your studies..."
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className="input-field"
                  style={{ minHeight: '110px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setFeedbackEvent(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="btn btn-primary"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

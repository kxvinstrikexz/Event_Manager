import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { CameraQRScannerModal } from '../../components/ui/CameraQRScannerModal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StaffAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [recentAttendees, setRecentAttendees] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manual fallback input state
  const [ticketCode, setTicketCode] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    attendee?: any;
    details?: any;
    timestamp?: string;
  } | null>(null);

  // Fetch organizer's events
  useEffect(() => {
    api.getMyStaffEvents()
      .then(res => {
        const evts = res.events || [];
        setEvents(evts);
        if (!selectedEventId && evts.length > 0) {
          setSelectedEventId(evts[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch attendees when checkpoint changes
  const refreshAttendees = async (eventIdToFetch: string) => {
    if (!eventIdToFetch) return;
    try {
      const attRes = await api.getEventAttendance(eventIdToFetch);
      setRecentAttendees(attRes.attendance || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      refreshAttendees(selectedEventId);
    }
  }, [selectedEventId]);

  // Clean up any lingering camera media streams when navigating away from the page
  useEffect(() => {
    return () => {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
          if (v.srcObject instanceof MediaStream) {
            v.srcObject.getTracks().forEach(track => track.stop());
            v.srcObject = null;
          }
        });
      } catch (e) {}
    };
  }, []);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Core attendance verification through existing backend
  const processAttendanceVerification = async (qr: string, code: string, checkpointNotes: string) => {
    if (!qr.trim() && !code.trim()) {
      setVerificationFeedback({
        type: 'error',
        message: 'Please provide either a Ticket Serial Code or Raw QR Scanner Payload.'
      });
      return;
    }

    setIsSubmitting(true);
    setVerificationFeedback(null);

    try {
      const payload: any = {
        eventId: selectedEventId || undefined,
        notes: checkpointNotes.trim() || undefined
      };

      if (qr.trim()) {
        payload.qrPayload = qr.trim();
      } else if (code.trim()) {
        payload.ticketCode = code.trim().toUpperCase();
      }

      const res = await api.verifyAttendance(payload);

      setVerificationFeedback({
        type: 'success',
        message: res.message || 'Attendance verified and recorded successfully.',
        attendee: res.attendee,
        timestamp: new Date().toLocaleTimeString()
      });

      // Refresh real-time roster
      if (selectedEventId) {
        refreshAttendees(selectedEventId);
      }
    } catch (err: any) {
      console.error('[Attendance Verification Error]', err);
      const msg = err.message || 'Verification failed. Please verify attendee credentials.';
      setVerificationFeedback({
        type: 'error',
        message: msg,
        details: err.data || null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Called when real QR is detected and decoded by camera
  const handleCameraScanSuccess = (decodedText: string) => {
    // 1. Close camera scanner modal (triggers complete camera stream stop)
    setIsScannerOpen(false);
    setCameraError(false);

    // 2. Put decoded QR value into Raw QR Scanner Payload field
    setQrPayload(decodedText);
    setTicketCode('');

    // 3. Clear any previous verification feedback so user can review & confirm manually
    setVerificationFeedback(null);

    // DO NOT automatically call the verification API or record attendance.
    // The user must manually click [ Confirm & Record Attendance ].
  };

  // Called when user clicks "Confirm & Record Attendance"
  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    processAttendanceVerification(qrPayload, ticketCode, notes);
  };

  const handleClearForm = () => {
    setTicketCode('');
    setQrPayload('');
    setNotes('');
    setVerificationFeedback(null);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Attendance Verification &amp; QR Center
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Official checkpoint verification using live device camera scanning with manual ticket fallback entry.
        </p>
      </div>

      {/* Target Event Selection */}
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
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 340px' }}>
          <label className="input-label" style={{ whiteSpace: 'nowrap', margin: 0, fontWeight: 600 }}>
            Session Checkpoint:
          </label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="input-field"
            style={{ height: '38px', fontSize: '0.875rem' }}
          >
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.date})
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Venue: <strong style={{ color: 'var(--text-primary)' }}>{selectedEvent.venue}</strong> &bull; Registered: <strong>{selectedEvent.registered_count}</strong> &bull; Checked-In: <strong style={{ color: 'var(--status-success-text)' }}>{recentAttendees.length}</strong>
          </div>
        )}
      </div>

      {/* ATTENDANCE SCANNER & VERIFICATION CONSOLE */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        {/* Top Camera Scanner Launch Area */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              Live Camera QR Scanner
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Use your laptop webcam or mobile device camera to scan student passes automatically.
            </p>
          </div>

          {/* 1. Scan QR Button */}
          <button
            type="button"
            onClick={() => {
              setCameraError(false);
              setIsScannerOpen(true);
            }}
            disabled={!selectedEventId}
            className="btn btn-primary"
            style={{ height: '42px', padding: '0 24px', fontSize: '0.9375rem', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Scan QR
          </button>
        </div>

        {/* Camera Error Notification (if camera unavailable) */}
        {cameraError && (
          <div style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-text)" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-warning-text)' }}>
                Camera unavailable. You can use manual entry below.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setCameraError(false);
                setIsScannerOpen(true);
              }}
              className="btn btn-outline"
              style={{
                height: '32px',
                fontSize: '0.8125rem',
                borderColor: 'var(--status-warning-border)',
                color: 'var(--status-warning-text)'
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Form: Manual Fallback Inputs & Confirmation */}
        <form onSubmit={handleSubmitManual}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* 2. Ticket Serial Code (Manual Entry) */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>
                Ticket Serial Code (Manual Entry)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="EVT-2026-B871A2"
                value={ticketCode}
                onChange={e => {
                  setTicketCode(e.target.value.toUpperCase());
                  if (e.target.value) setQrPayload('');
                }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', letterSpacing: '0.04em' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Alphanumeric ticket serial code printed on attendee pass.
              </div>
            </div>

            {/* 4. Checkpoint Notes (Optional) */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 600 }}>
                Checkpoint Notes (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Verified at South Entry Portal"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ fontSize: '0.9375rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Checkpoint gate or verification notes recorded with attendance.
              </div>
            </div>
          </div>

          {/* 3. Raw QR Scanner Payload */}
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label className="input-label" style={{ fontWeight: 600 }}>
              Raw QR Scanner Payload
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Raw cryptographic QR token will appear here automatically when scanned via camera, or can be pasted manually as fallback."
              value={qrPayload}
              onChange={e => {
                setQrPayload(e.target.value);
                if (e.target.value) setTicketCode('');
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                lineHeight: 1.4,
                resize: 'vertical'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Populated automatically upon camera scan, or paste raw HMAC credential manually.
            </div>
          </div>

          {/* Verification Feedback Banner */}
          {verificationFeedback && (
            <div style={{
              backgroundColor: verificationFeedback.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
              border: `1px solid ${verificationFeedback.type === 'success' ? 'var(--status-success-border)' : 'var(--status-error-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px',
              color: verificationFeedback.type === 'success' ? 'var(--status-success-text)' : 'var(--status-error-text)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>
                  {verificationFeedback.type === 'success' ? '✓' : '✕'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '4px' }}>
                    {verificationFeedback.message}
                  </div>
                  {verificationFeedback.attendee && (
                    <div style={{ fontSize: '0.8125rem', marginTop: '6px', color: 'var(--text-primary)' }}>
                      <strong>{verificationFeedback.attendee.fullName}</strong> &bull; ID:{' '}
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{verificationFeedback.attendee.studentId}</span>{' '}
                      &bull; {verificationFeedback.attendee.department} &bull; Ticket:{' '}
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{verificationFeedback.attendee.ticketCode}</span>
                    </div>
                  )}
                  {verificationFeedback.details?.alreadyRecordedAt && (
                    <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                      Previously recorded at: <strong>{verificationFeedback.details.alreadyRecordedAt}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Action Buttons: Confirm & Record Attendance + Clear */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={isSubmitting || (!ticketCode.trim() && !qrPayload.trim())}
              className="btn btn-primary"
              style={{ height: '42px', padding: '0 28px', fontSize: '0.9375rem' }}
            >
              {isSubmitting ? 'Verifying with Backend...' : 'Confirm & Record Attendance'}
            </button>

            {(ticketCode || qrPayload || notes || verificationFeedback) && (
              <button
                type="button"
                onClick={handleClearForm}
                className="btn btn-outline"
                style={{ height: '42px', fontSize: '0.875rem' }}
              >
                Clear Form
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Verified Attendees Roster for Current Session */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title" style={{ fontSize: '1.05rem' }}>
              Confirmed Session Attendees
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time audit log of students verified by camera scanning or manual fallback
            </div>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--status-success-text)' }}>
            {recentAttendees.length} Verified Check-Ins
          </span>
        </div>

        {recentAttendees.length === 0 ? (
          <EmptyState
            title="No attendees checked in yet"
            description="Use 'Scan QR' or enter a ticket serial code above to record attendance for this session."
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Attendee Name</th>
                  <th>Student ID &amp; Dept</th>
                  <th>Ticket Code</th>
                  <th>Verification Timestamp</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendees.map(att => (
                  <tr key={att.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {att.student_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {att.student_email}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)' }}>{att.student_register_number || 'ID N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{att.student_department}</div>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {att.ticket_code}
                    </td>

                    <td style={{ fontSize: '0.8125rem' }}>
                      {att.verified_at}
                    </td>

                    <td>
                      <span className="badge badge-active">
                        {att.verification_method === 'qr_scan' ? 'Camera QR' : 'Manual Entry'}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-verified">
                        Attended
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Real Hardware Camera QR Scanner Modal - Conditionally mounted for clean lifecycle */}
      {isScannerOpen && (
        <CameraQRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          eventName={selectedEvent?.title}
          onScanSuccess={handleCameraScanSuccess}
          onCameraUnavailable={() => setCameraError(true)}
        />
      )}
    </div>
  );
};

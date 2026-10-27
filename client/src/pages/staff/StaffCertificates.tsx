import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { CertificateViewModal } from '../../components/ui/CertificateViewModal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StaffCertificates: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

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

  const fetchCertificates = async () => {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const res = await api.getEventCertificates(selectedEventId);
      setCertificates(res.certificates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [selectedEventId]);

  const handleBulkIssue = async () => {
    if (!selectedEventId) return;
    if (!window.confirm('Generate official participation credentials for all verified attendees of this session?')) return;
    setBulkIssuing(true);
    setBulkMessage(null);
    try {
      const res = await api.bulkIssueCertificates(selectedEventId);
      setBulkMessage(res.message);
      fetchCertificates();
    } catch (err: any) {
      setBulkMessage('Failed: ' + (err.message || 'Error'));
    } finally {
      setBulkIssuing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Certificate Issuance &amp; Records
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Award and manage authenticated certificates of participation for verified event attendees.
        </p>
      </div>

      {/* Event Selection & Bulk Action Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
          <label className="input-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Event Session:
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

        <button
          onClick={handleBulkIssue}
          disabled={bulkIssuing || !selectedEventId}
          className="btn btn-primary"
          style={{ height: '38px', fontSize: '0.8125rem' }}
        >
          {bulkIssuing ? 'Generating Serial Numbers...' : '⚡ Bulk Issue to All Attendees'}
        </button>
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

      {/* Certificates Table */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Retrieving certificate records...
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          title="No certificates issued for this event yet"
          description="Use the bulk issue button above to generate official credentials for verified attendees."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Attendee Name</th>
                <th>Student ID &amp; Dept</th>
                <th>Serial Number</th>
                <th>Conferred Date</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map(cert => (
                <tr key={cert.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cert.student_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {cert.student_email}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{cert.student_register_number || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cert.student_department}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {cert.certificate_number}
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {cert.issue_date?.split(' ')[0] || cert.issue_date}
                  </td>
                  <td>
                    <span className={`badge badge-${cert.verification_status}`}>
                      {cert.verification_status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="btn btn-outline"
                      style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                    >
                      View Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CertificateViewModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />
    </div>
  );
};

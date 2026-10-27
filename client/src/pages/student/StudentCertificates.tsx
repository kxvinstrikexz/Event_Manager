import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { CertificateViewModal } from '../../components/ui/CertificateViewModal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const StudentCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.getMyCertificates();
      setCertificates(res.certificates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Official Certificates of Participation
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Authenticated university credentials conferred for verified symposium attendance. Each certificate bears a cryptographic serial number verifiable by academic boards and employers.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Checking university credential registry...
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          title="No certificates conferred yet"
          description="Certificates are automatically or manually issued by faculty organizers following verified attendance at university events."
          actionText="View Registered Events"
          onAction={() => window.location.href = '/student/registrations'}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Certificate Title &amp; Event</th>
                <th>Conferred Date</th>
                <th>Serial Number</th>
                <th>Verification Status</th>
                <th>Issuer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map(cert => (
                <tr key={cert.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cert.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Event: {cert.event_title}
                    </div>
                  </td>

                  <td>
                    <div>{cert.issue_date?.split(' ')[0] || cert.issue_date}</div>
                  </td>

                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {cert.certificate_number}
                  </td>

                  <td>
                    <span className={`badge badge-${cert.verification_status}`}>
                      {cert.verification_status}
                    </span>
                  </td>

                  <td style={{ fontSize: '0.8125rem' }}>
                    {cert.issuer_name || 'Academic Administration'}
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="btn btn-outline"
                        style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                      >
                        View &amp; Print
                      </button>
                      <Link
                        to={`/verify?serial=${cert.certificate_number}`}
                        target="_blank"
                        className="btn btn-secondary"
                        style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                      >
                        Verify
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <CertificateViewModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />
    </div>
  );
};

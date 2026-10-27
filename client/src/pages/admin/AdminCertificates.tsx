import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { CertificateViewModal } from '../../components/ui/CertificateViewModal.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

export const AdminCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.getAllCertificates({ search: search.trim() || undefined });
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
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Platform Academic Credentials Ledger
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Audit official certificates of participation, verify institutional serial numbers, and inspect conferred credentials.
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
        <form onSubmit={(e) => { e.preventDefault(); fetchCertificates(); }} style={{ display: 'flex', gap: '8px', maxWidth: '380px', width: '100%' }}>
          <input
            type="text"
            placeholder="Search by serial number, recipient, or event..."
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
          Conferred Certificates: <strong>{certificates.length}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading credentials ledger...
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          title="No certificates conferred in registry"
          description="Issued credentials from all faculties will be indexed here."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Recipient Student</th>
                <th>Student ID &amp; Dept</th>
                <th>Event Title</th>
                <th>Conferred Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map(cert => (
                <tr key={cert.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {cert.certificate_number}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cert.student_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {cert.student_email}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{cert.student_register_number || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cert.student_department}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 500 }}>{cert.event_title}</div>
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
                      Inspect &amp; Print
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

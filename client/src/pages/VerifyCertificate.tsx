import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';

export const VerifyCertificate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSerial = searchParams.get('serial') || '';

  const [serial, setSerial] = useState(initialSerial);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doVerify = async (querySerial: string) => {
    if (!querySerial) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await api.verifyCertificateNumber(querySerial);
      setResult(res.certificate);
    } catch (err: any) {
      setError(err.message || 'No certificate record exists matching this serial number.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSerial) {
      doVerify(initialSerial);
    }
  }, [initialSerial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doVerify(serial.trim());
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        padding: '20px 48px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--dark-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.45 9L12 4.34 20.55 9 12 13.66 3.45 9zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            CampusEvents
          </span>
        </Link>
        <Link to="/" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          &larr; Return to Gateway
        </Link>
      </header>

      <main style={{
        flex: 1,
        maxWidth: '680px',
        width: '100%',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-base)', marginBottom: '6px' }}>
            Academic Credentials Registry
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Institutional Certificate Verification
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Verify the authenticity of university-issued event participation credentials.
          </p>
        </div>

        {/* Verification Input Box */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '32px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              required
              placeholder="e.g. CE-CERT-2026-89104"
              value={serial}
              onChange={e => setSerial(e.target.value.toUpperCase())}
              className="input-field"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', height: '42px' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: '42px', padding: '0 24px' }}
            >
              {loading ? 'Checking...' : 'Verify'}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: '20px',
              padding: '14px',
              backgroundColor: 'var(--status-error-bg)',
              color: 'var(--status-error-text)',
              border: '1px solid var(--status-error-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84375rem'
            }}>
              ✕ {error}
            </div>
          )}
        </div>

        {/* Verified Result Card */}
        {result && (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid var(--status-success-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success-text)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '16px'
            }}>
              ✓ AUTHENTIC UNIVERSITY CREDENTIAL CONFIRMED
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {result.title}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              margin: '20px 0',
              padding: '16px 0',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.875rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conferred Scholar</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{result.student_name}</div>
                {result.student_register_number && (
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    ID: {result.student_register_number}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{result.student_department || 'General Academic'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Event Session</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{result.event_title}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conferred Date</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{result.issue_date?.split(' ')[0] || result.issue_date}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Registry Record: {result.certificate_number} &bull; Conferred by {result.issuer_name || 'Academic Administration'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

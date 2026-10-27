import React from 'react';
import { Modal } from './Modal.js';

interface CertificateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: any | null;
}

export const CertificateViewModal: React.FC<CertificateViewModalProps> = ({
  isOpen,
  onClose,
  certificate
}) => {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Institutional Certificate of Participation" maxWidth="680px">
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#2A3E4B',
        padding: '36px 32px',
        border: '3px double #7FA6B8',
        borderRadius: 'var(--radius-sm)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Subtle Watermark Seal */}
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 12px',
          borderRadius: '50%',
          border: '2px solid #2A3E4B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#2A3E4B">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.45 9L12 4.34 20.55 9 12 13.66 3.45 9zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
          </svg>
        </div>

        <div style={{
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#586F7D',
          marginBottom: '4px'
        }}>
          CampusEvents — University Academic Board
        </div>

        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#2A3E4B',
          marginBottom: '16px',
          letterSpacing: '-0.01em'
        }}>
          CERTIFICATE OF PARTICIPATION
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#586F7D', margin: '14px 0 6px' }}>
          This certifies that official participation has been recorded for
        </p>

        <div style={{
          fontSize: '1.45rem',
          fontWeight: 700,
          color: '#2A3E4B',
          borderBottom: '1px solid #BDD3DE',
          display: 'inline-block',
          padding: '4px 32px 8px',
          marginBottom: '12px'
        }}>
          {certificate.student_name}
        </div>

        {certificate.student_register_number && (
          <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: '#586F7D', marginBottom: '14px' }}>
            Register No: {certificate.student_register_number} • Department: {certificate.student_department || 'General Academic'}
          </div>
        )}

        <p style={{ fontSize: '0.9rem', color: '#586F7D', maxWidth: '520px', margin: '0 auto 18px' }}>
          for attending and actively participating in the university session
        </p>

        <div style={{
          fontSize: '1.15rem',
          fontWeight: 600,
          color: '#2A3E4B',
          marginBottom: '20px'
        }}>
          "{certificate.event_title}"
        </div>

        {/* Certificate metadata grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          maxWidth: '460px',
          margin: '24px auto 16px',
          textAlign: 'left',
          fontSize: '0.8125rem',
          borderTop: '1px solid #DCE7ED',
          paddingTop: '16px'
        }}>
          <div>
            <div style={{ color: '#7A93A2', fontSize: '0.75rem' }}>Conferred Date</div>
            <div style={{ fontWeight: 600 }}>{certificate.issue_date?.split(' ')[0] || certificate.issue_date}</div>
          </div>
          <div>
            <div style={{ color: '#7A93A2', fontSize: '0.75rem' }}>Authorized Issuer</div>
            <div style={{ fontWeight: 600 }}>{certificate.issuer_name || 'Academic Administration'}</div>
          </div>
          <div>
            <div style={{ color: '#7A93A2', fontSize: '0.75rem' }}>Certificate Serial</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{certificate.certificate_number}</div>
          </div>
          <div>
            <div style={{ color: '#7A93A2', fontSize: '0.75rem' }}>Institutional Verification</div>
            <div style={{ fontWeight: 600, color: '#21674A' }}>VERIFIED AUTHENTIC</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Serial: <span style={{ fontFamily: 'var(--font-mono)' }}>{certificate.certificate_number}</span>
        </div>
        <button onClick={handlePrint} className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Print / Download Certificate
        </button>
      </div>
    </Modal>
  );
};

import React from 'react';
import { Modal } from './Modal.js';

interface TicketPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  passData: {
    registration?: any;
    event?: any;
    qrDataUrl?: string;
  } | null;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  isOpen,
  onClose,
  passData
}) => {
  if (!passData) return null;
  const { registration, event, qrDataUrl } = passData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official University Event Pass" maxWidth="480px">
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
        {/* Ticket Header */}
        <div style={{
          backgroundColor: 'var(--dark-base)',
          color: '#FFFFFF',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
              University Credential
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>
              CampusEvents
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            padding: '4px 8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-sm)'
          }}>
            {registration?.ticket_code}
          </div>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-base)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {event?.category || 'University Event'}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 16px' }}>
            {event?.title}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '18px',
            fontSize: '0.8125rem'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event?.date}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Time</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event?.start_time} - {event?.end_time}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Venue</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event?.venue}</div>
            </div>
          </div>

          <div className="divider" style={{ margin: '14px 0' }} />

          {/* Attendee info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            fontSize: '0.8125rem'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Attendee</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {registration?.student_name || 'Registered Student'}
              </div>
            </div>
            {registration?.student_register_number && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Reg No.</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {registration.student_register_number}
                </div>
              </div>
            )}
          </div>

          {/* QR Code Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            margin: '12px 0'
          }}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Event QR Pass"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            ) : (
              <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Generating QR...
              </div>
            )}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#2A3E4B',
              marginTop: '8px',
              letterSpacing: '0.04em'
            }}>
              {registration?.ticket_code}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6E8290', marginTop: '4px' }}>
              Present this pass at entry verification checkpoint
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: 'var(--bg-secondary-light)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Status: <strong style={{ color: 'var(--status-success-text)' }}>CONFIRMED</strong>
          </span>
          <button onClick={handlePrint} className="btn btn-outline" style={{ height: '34px', fontSize: '0.8125rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print / Save Pass
          </button>
        </div>
      </div>
    </Modal>
  );
};

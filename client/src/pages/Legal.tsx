import React from 'react';
import { Link } from 'react-router-dom';

export const Legal: React.FC<{ type: 'terms' | 'privacy' }> = ({ type }) => {
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
        maxWidth: '760px',
        width: '100%',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Institutional Draft Notice */}
        <div style={{
          padding: '12px 18px',
          backgroundColor: 'var(--status-warning-bg)',
          border: '1px solid var(--status-warning-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: 'var(--status-warning-text)',
          marginBottom: '28px',
          letterSpacing: '0.04em'
        }}>
          DRAFT — REQUIRES REVIEW BY UNIVERSITY GENERAL COUNSEL
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          {type === 'terms' ? 'Terms of Institutional Service' : 'Institutional Privacy Policy'}
        </h1>

        <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {type === 'terms' ? (
            <>
              <p>
                <strong>1. Acceptance of Institutional Policies:</strong> Use of the CampusEvents portal is reserved for registered students, faculty members, and institutional administrative staff of the university. Access to event registration, certificate issuance, and attendance verification is subject to academic honor codes.
              </p>
              <p>
                <strong>2. Digital Event Passes &amp; Attendance Integrity:</strong> Digital QR passes issued through CampusEvents are non-transferable. Attempting to scan duplicate or fraudulent codes is a violation of university conduct policies. Attendance logs constitute official academic participation records.
              </p>
              <p>
                <strong>3. Faculty Event Creation:</strong> Faculty and staff organizers agree to publish accurate schedules, room capacities, and guidelines. Event cancelations must be recorded with prompt student notifications.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Information Collection:</strong> CampusEvents processes student names, official email addresses, academic departments, student register numbers, and enrollment records solely for managing university event participation.
              </p>
              <p>
                <strong>2. Data Retention &amp; Security:</strong> Account credentials are encrypted using industry-standard cryptographic hash functions. Attendance records and certificates are retained as part of the student's institutional co-curricular transcript.
              </p>
              <p>
                <strong>3. Disclosure:</strong> Data collected within CampusEvents is strictly restricted to university administration and verified faculty organizers. Data is not monetized or shared with unauthorized commercial entities.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

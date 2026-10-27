import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.js';

export const Gateway: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Institutional Top Header */}
      <header style={{
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--dark-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.45 9L12 4.34 20.55 9 12 13.66 3.45 9zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              CampusEvents
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
              University Event Management System
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/verify" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Verify Certificate
          </Link>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              padding: '6px',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Refined Composition */}
      <main style={{
        flex: 1,
        maxWidth: '960px',
        width: '100%',
        margin: '0 auto',
        padding: '64px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Editorial Introduction */}
        <div style={{ marginBottom: '48px', maxWidth: '640px' }}>
          <div style={{
            fontSize: '0.78125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
            color: 'var(--accent-base)',
            marginBottom: '8px'
          }}>
            Institutional Gateway
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            Choose your portal
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Select your university role to access event registrations, academic symposia, operational scheduling, and institutional compliance records.
          </p>
        </div>

        {/* Refined Horizontal/Structured Selection List (No giant bento/cards) */}
        <div style={{
          borderTop: '1px solid var(--border-strong)',
          borderBottom: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Portal 1: Student */}
          <Link
            to="/student/login"
            style={{
              padding: '28px 20px',
              display: 'grid',
              gridTemplateColumns: '180px 1fr 140px',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              transition: 'background var(--trans-fast)',
              gap: '24px'
            }}
            className="gateway-row"
          >
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-base)', fontWeight: 600 }}>
                Collegiate Access
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Student
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Discover campus seminars, register with one click, generate official QR passes, submit post-event feedback, and download verified certificates.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Enter Portal &rarr;
              </span>
            </div>
          </Link>

          {/* Portal 2: Staff & Faculty */}
          <Link
            to="/staff/login"
            style={{
              padding: '28px 20px',
              display: 'grid',
              gridTemplateColumns: '180px 1fr 140px',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              transition: 'background var(--trans-fast)',
              gap: '24px'
            }}
            className="gateway-row"
          >
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-base)', fontWeight: 600 }}>
                Academic & Departmental
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Staff & Faculty
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Create authorized department events, oversee registrations, verify attendance in real-time with the QR scanner, and issue authenticated credentials.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                Enter Portal &rarr;
              </span>
            </div>
          </Link>

          {/* Portal 3: Administration */}
          <Link
            to="/admin/login"
            style={{
              padding: '28px 20px',
              display: 'grid',
              gridTemplateColumns: '180px 1fr 140px',
              alignItems: 'center',
              transition: 'background var(--trans-fast)',
              gap: '24px'
            }}
            className="gateway-row"
          >
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--dark-base)', fontWeight: 700 }}>
                Central Operations
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Administration
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Manage faculty applications, approve staff credentials, review cross-campus participation metrics, and audit event compliance.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                Control Center &rarr;
              </span>
            </div>
          </Link>
        </div>

        {/* Institutional Sub-links */}
        <div style={{
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            &copy; 2026 CampusEvents. Official University Software. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/terms" style={{ color: 'var(--text-secondary)' }}>Terms of Service</Link>
            <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

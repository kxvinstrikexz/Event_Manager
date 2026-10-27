import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Sidebar } from './Sidebar.js';
import { Topbar } from './Topbar.js';

interface PortalLayoutProps {
  portal: 'student' | 'staff' | 'admin';
  title: string;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ portal, title }) => {
  const { user, isLoading, refreshUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid var(--border-strong)',
            borderTopColor: 'var(--dark-base)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px'
          }} />
          <p style={{ fontSize: '0.875rem' }}>Authenticating institutional session...</p>
        </div>
      </div>
    );
  }

  // Auth requirement check
  if (!user) {
    return <Navigate to={`/${portal}/login`} replace />;
  }

  // Role validation check
  if (user.role !== portal) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Special Staff Status Gate: checks approvalStatus and account_status
  const isStaffBlocked = portal === 'staff' && (
    (user.approvalStatus && user.approvalStatus !== 'approved') ||
    (user.account_status && user.account_status !== 'active')
  );

  if (isStaffBlocked) {
    const isSuspended = user.account_status === 'suspended' || user.approvalStatus === 'suspended';
    const isBanned = user.account_status === 'banned';
    const isDeleted = user.account_status === 'deleted';
    const isPending = user.approvalStatus === 'pending' && !isSuspended && !isBanned && !isDeleted;
    const isRejected = user.approvalStatus === 'rejected' && !isSuspended && !isBanned && !isDeleted;

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '560px',
          width: '100%',
          padding: '36px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '16px',
            backgroundColor: isPending ? 'var(--status-warning-bg)' : 'var(--status-error-bg)',
            color: isPending ? 'var(--status-warning-text)' : 'var(--status-error-text)',
            border: `1px solid ${isPending ? 'var(--status-warning-border)' : 'var(--status-error-border)'}`
          }}>
            Account Status: {isSuspended ? 'Suspended' : isBanned ? 'Banned' : isDeleted ? 'Deactivated' : user.approvalStatus}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>
            {isPending && 'Faculty Account Pending Verification'}
            {isRejected && 'Staff Registration Application Not Approved'}
            {isSuspended && 'Faculty Credentials Suspended'}
            {isBanned && 'Staff Account Disabled / Banned'}
            {isDeleted && 'Staff Account Permanently Disabled'}
          </h2>

          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            {isPending && (
              <>
                Your registration for <strong>{user.profile?.full_name || user.email}</strong> ({user.profile?.staff_id || 'Staff ID'}) has been submitted to the University Central Administration.
                Institutional security policies require verification before granting access to event creation, attendee records, and attendance scanners.
              </>
            )}
            {isRejected && (
              <>
                The administration has reviewed your profile and declined the access request. Please contact your department head or academic registrar for clarification.
              </>
            )}
            {isSuspended && (
              <>
                Your faculty/staff credentials have been suspended by institutional administration. Access to event management and scanning tools is blocked.
              </>
            )}
            {isBanned && (
              <>
                Your staff account has been disabled by the university administrator due to security or policy enforcement.
              </>
            )}
            {isDeleted && (
              <>
                This staff account has been permanently deactivated. Historical university records remain preserved under institutional archive.
              </>
            )}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => refreshUser()} className="btn btn-secondary">
              Check Status Again
            </button>
            <button onClick={() => logout()} className="btn btn-outline">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar
        portal={portal}
        isOpenOnMobile={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          title={title}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
        />
        <main style={{ flex: 1, padding: '28px 32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

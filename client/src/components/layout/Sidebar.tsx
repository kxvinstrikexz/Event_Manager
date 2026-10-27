import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  portal: 'student' | 'staff' | 'admin';
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ portal, isOpenOnMobile, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(`/${portal}/login`);
  };

  const portalConfig = {
    student: {
      badge: 'Student Portal',
      links: [
        { to: '/student/dashboard', label: 'Dashboard' },
        { to: '/student/events', label: 'Browse Events' },
        { to: '/student/registrations', label: 'My Registrations' },
        { to: '/student/certificates', label: 'Certificates' },
        { to: '/student/profile', label: 'My Profile' }
      ]
    },
    staff: {
      badge: 'Faculty & Staff',
      links: [
        { to: '/staff/dashboard', label: 'Dashboard' },
        { to: '/staff/events', label: 'Manage Events' },
        { to: '/staff/events/create', label: 'Create Event' },
        { to: '/staff/attendance', label: 'Attendance & QR' },
        { to: '/staff/feedback', label: 'Event Feedback' },
        { to: '/staff/certificates', label: 'Certificates' },
        { to: '/staff/profile', label: 'Faculty Profile' }
      ]
    },
    admin: {
      badge: 'Administration',
      links: [
        { to: '/admin/dashboard', label: 'Control Center' },
        { to: '/admin/staff-management', label: 'Staff Management' },
        { to: '/admin/staff', label: 'Staff Approvals' },
        { to: '/admin/events', label: 'All Events' },
        { to: '/admin/registrations', label: 'Registrations' },
        { to: '/admin/attendance', label: 'Attendance' },
        { to: '/admin/feedback', label: 'Feedback' },
        { to: '/admin/certificates', label: 'Certificates' },
        { to: '/admin/reports', label: 'Analytics & Reports' },
        { to: '/admin/profile', label: 'Settings' }
      ]
    }
  }[portal];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 24, 31, 0.45)',
            zIndex: 90
          }}
        />
      )}

      <aside
        style={{
          width: '240px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 95,
          transition: 'transform var(--trans-base)'
        }}
        className={isOpenOnMobile ? 'sidebar-mobile-open' : 'sidebar-desktop'}
      >
        {/* Brand identity */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              CampusEvents
            </span>
          </div>
          <div style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
            color: 'var(--accent-base)'
          }}>
            {portalConfig.badge}
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {portalConfig.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to.endsWith('/dashboard')}
                onClick={onCloseMobile}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.84375rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                  transition: 'background var(--trans-fast), color var(--trans-fast)'
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User profile & session logout */}
        <div style={{
          padding: '16px 16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.profile?.full_name || user?.username || user?.email || 'Logged In'}
            </div>
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.email || (user?.username ? `@${user.username}` : '')}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '32px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

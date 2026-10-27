import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 24, 31, 0.4)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-modal)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border-subtle)'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Notifications</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Institutional Alerts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleMarkAllRead}
              className="btn btn-outline"
              style={{ height: '28px', padding: '0 8px', fontSize: '0.7rem' }}
              title="Mark all as read"
            >
              Mark all read
            </button>
            <button onClick={onClose} style={{ padding: '4px', color: 'var(--text-muted)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No notifications at this time.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: n.is_read ? 'transparent' : 'var(--bg-secondary-light)',
                  border: '1px solid',
                  borderColor: n.is_read ? 'var(--border-subtle)' : 'var(--border-strong)',
                  marginBottom: '10px',
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition: 'background var(--trans-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {n.title}
                  </span>
                  {!n.is_read && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-base)', display: 'inline-block' }} />
                  )}
                </div>
                <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '6px' }}>
                  {n.message}
                </p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {n.created_at?.split(' ')[0] || n.created_at}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

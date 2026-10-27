import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--bg-surface)',
      margin: '20px 0'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        margin: '0 auto 14px',
        borderRadius: '50%',
        backgroundColor: 'var(--bg-secondary-light)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ maxWidth: '420px', margin: '0 auto 18px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary" style={{ height: '36px', fontSize: '0.8125rem' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};

import React from 'react';

interface BadgeProps {
  status: string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label }) => {
  const normalized = status.toLowerCase();
  return (
    <span className={`badge badge-${normalized}`}>
      {label || status}
    </span>
  );
};

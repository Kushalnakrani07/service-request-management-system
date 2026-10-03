/**
 * ==============================================================================
 * STATUS BADGE COMPONENT
 * ==============================================================================
 * 
 * Displays color-coded pills corresponding to request lifecycle states.
 */

import React from 'react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className: 'badge-pending',
    dot: '⏳'
  },
  assigned: {
    label: 'Assigned',
    className: 'badge-assigned',
    dot: '👤'
  },
  'in-progress': {
    label: 'In Progress',
    className: 'badge-in-progress',
    dot: '🔧'
  },
  completed: {
    label: 'Completed',
    className: 'badge-completed',
    dot: '✓'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'badge-cancelled',
    dot: '✕'
  }
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'badge-pending',
    dot: '•'
  };

  return (
    <span className={`badge ${config.className}`}>
      <span>{config.dot}</span>
      <span>{config.label}</span>
    </span>
  );
}

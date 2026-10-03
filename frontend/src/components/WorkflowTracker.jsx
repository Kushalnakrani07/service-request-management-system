/**
 * ==============================================================================
 * WORKFLOW TRACKER COMPONENT (Finite State Machine Visualizer)
 * ==============================================================================
 * 
 * Visually depicts the step-by-step progress of a Service Request:
 * [1. Pending] ──> [2. Assigned] ──> [3. In Progress] ──> [4. Completed]
 */

import React from 'react';

const STEPS = [
  { key: 'pending', label: '1. Pending Request', icon: '📝' },
  { key: 'assigned', label: '2. Assigned to Provider', icon: '👤' },
  { key: 'in-progress', label: '3. In Progress', icon: '🔧' },
  { key: 'completed', label: '4. Completed', icon: '✅' }
];

export default function WorkflowTracker({ currentStatus, statusHistory = [] }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="alert alert-danger" style={{ margin: '20px 0' }}>
        <strong>⚠️ Request Cancelled:</strong> This service request has been cancelled and will not progress further.
      </div>
    );
  }

  const stepOrder = ['pending', 'assigned', 'in-progress', 'completed'];
  const currentIndex = stepOrder.indexOf(currentStatus);

  // Calculate progress percentage for the connecting bar
  const progressPercent = currentIndex <= 0 ? 0 : (currentIndex / (stepOrder.length - 1)) * 100;

  return (
    <div style={{ margin: '24px 0 32px' }}>
      <div className="workflow-tracker">
        {/* Background connecting bar */}
        <div className="workflow-bar">
          <div
            className="workflow-bar-progress"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Circles */}
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex || currentStatus === 'completed';
          const isActive = idx === currentIndex && currentStatus !== 'completed';

          let stepClass = '';
          if (isCompleted) stepClass = 'completed';
          if (isActive) stepClass = 'active';

          // Look up timestamp from history if available
          const historyEntry = statusHistory.find((h) => h.status === step.key);
          const timeString = historyEntry
            ? new Date(historyEntry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;

          return (
            <div key={step.key} className={`workflow-step ${stepClass}`}>
              <div className="step-circle">
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className="step-label">{step.label}</div>
              {timeString && (
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 2 }}>
                  {timeString}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

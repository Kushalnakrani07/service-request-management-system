/**
 * ==============================================================================
 * REQUEST DETAILS & WORKFLOW TRACKER PAGE
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * This page brings together all key requirements:
 * 1. Fetches single request via `GET /api/requests/:id` (Ownership-protected).
 * 2. Visualizes the status lifecycle via `WorkflowTracker`.
 * 3. Shows the audit history timeline (`statusHistory`).
 * 4. Provides the Provider Action Panel:
 *    - ONLY the assigned service provider can update status!
 *    - Enforces finite state machine transitions:
 *      'assigned' -> 'in-progress' -> 'completed'
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import WorkflowTracker from '../components/WorkflowTracker';

export default function RequestDetails({ requestId, setCurrentView }) {
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Status update inputs
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [providerNote, setProviderNote] = useState('');

  // Provider assignment inputs (for pending requests)
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProviderToAssign, setSelectedProviderToAssign] = useState('');

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.requests.getById(requestId);
      if (res.success) {
        setRequest(res.data);
        if (res.data.resolutionNotes) {
          setResolutionNotes(res.data.resolutionNotes);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  // Load providers if request is unassigned/pending
  useEffect(() => {
    if (request && request.status === 'pending') {
      api.requests.getProviders(request.category).then((res) => {
        if (res.success) setAvailableProviders(res.data);
      });
    }
  }, [request]);

  // Handle assigned provider updating status: assigned -> in-progress -> completed
  const handleUpdateStatus = async (nextStatus) => {
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);

    try {
      const payload = {
        status: nextStatus,
        resolutionNotes: nextStatus === 'completed' ? resolutionNotes : undefined,
        note: providerNote || `Status updated to ${nextStatus}`
      };

      const res = await api.requests.updateStatus(requestId, payload);
      if (res.success) {
        setRequest(res.data);
        setActionSuccess(`Workflow status updated to '${nextStatus}' successfully!`);
        setProviderNote('');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle assigning provider
  const handleAssignProvider = async () => {
    if (!selectedProviderToAssign) return;
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);

    try {
      const res = await api.requests.assign(requestId, selectedProviderToAssign);
      if (res.success) {
        setRequest(res.data);
        setActionSuccess(`Assigned to provider successfully!`);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--gray-500)' }}>
        Loading request details from server...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container" style={{ padding: '40px 20px', maxWidth: 650 }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ marginBottom: 20 }}
          onClick={() => setCurrentView('dashboard')}
        >
          ← Back to Dashboard
        </button>
        <div className="alert alert-danger">
          <strong>Access Denied or Not Found:</strong> {error || 'Request not found'}
        </div>
        <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
          Remember: In this system, customers cannot view requests created by other customers,
          and service providers cannot view requests not assigned to them!
        </p>
      </div>
    );
  }

  // Check if logged-in user is the assigned provider
  const isAssignedProvider =
    user?.role === 'provider' &&
    request.serviceProvider &&
    (request.serviceProvider._id === user.id || request.serviceProvider._id === user._id);

  return (
    <div className="container" style={{ padding: '30px 20px', maxWidth: 900 }}>
      {/* Back button */}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        style={{ marginBottom: 20 }}
        onClick={() => setCurrentView('dashboard')}
      >
        ← Back to Dashboard
      </button>

      {/* Main Details Card */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-role" style={{ textTransform: 'capitalize' }}>
                {request.category}
              </span>
              <span
                className="badge"
                style={{
                  background:
                    request.priority === 'urgent'
                      ? 'var(--danger-bg)'
                      : request.priority === 'high'
                      ? 'var(--warning-bg)'
                      : 'var(--gray-100)',
                  color:
                    request.priority === 'urgent'
                      ? 'var(--danger)'
                      : request.priority === 'high'
                      ? '#b45309'
                      : 'var(--gray-700)'
                }}
              >
                Priority: {request.priority}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                ID: {request._id}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)' }}>
              {request.title}
            </h1>
          </div>

          <StatusBadge status={request.status} />
        </div>

        {/* Visual Lifecycle Progress Bar */}
        <WorkflowTracker
          currentStatus={request.status}
          statusHistory={request.statusHistory}
        />

        {/* Description */}
        <div style={{ background: 'var(--gray-50)', padding: 18, borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 6 }}>
            Problem Description
          </div>
          <p style={{ color: 'var(--gray-800)', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
            {request.description}
          </p>
        </div>

        {/* Info Grid: Customer and Provider */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Customer Card */}
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
              👤 Customer Details
            </div>
            <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
              {request.customer?.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 2 }}>
              ✉️ {request.customer?.email}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 2 }}>
              📞 {request.customerPhone || request.customer?.phone}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 4 }}>
              📍 {request.serviceAddress}
            </div>
          </div>

          {/* Service Provider Card */}
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>
              🔧 Service Provider
            </div>
            {request.serviceProvider ? (
              <>
                <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                  {request.serviceProvider.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 2 }}>
                  Specialization: <strong style={{ textTransform: 'capitalize' }}>{request.serviceProvider.specialization}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 2 }}>
                  📞 {request.serviceProvider.phone}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 2 }}>
                  ✉️ {request.serviceProvider.email}
                </div>
              </>
            ) : (
              <div>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>⚠️ Unassigned</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: 4 }}>
                  Awaiting dispatch or specialist provider assignment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resolution Notes (if completed) */}
        {request.status === 'completed' && request.resolutionNotes && (
          <div className="alert alert-success" style={{ margin: '16px 0' }}>
            <div>
              <strong>✅ Resolution Summary from Provider:</strong>
              <div style={{ marginTop: 4, whiteSpace: 'pre-line' }}>{request.resolutionNotes}</div>
            </div>
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------------
          PROVIDER ACTION PANEL (Visible only if assigned to logged-in provider!)
          ----------------------------------------------------------------------- */}
      {isAssignedProvider && (
        <div className="card" style={{ padding: 28, marginBottom: 24, border: '2px solid #818cf8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>🛠️</span>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                Provider Workflow Action Panel
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                As the assigned provider for this request, you have permission to update its status.
              </p>
            </div>
          </div>

          {actionSuccess && <div className="alert alert-success">🎉 {actionSuccess}</div>}
          {actionError && <div className="alert alert-danger">⚠️ {actionError}</div>}

          {/* Workflow step 1: Assigned -> Start Work */}
          {request.status === 'assigned' && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', marginBottom: 12 }}>
                When you arrive at the customer's location and begin diagnostic or repair work,
                transition the status to <strong>In Progress</strong>.
              </p>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional note: (e.g. Arrived on site, inspecting pipes)"
                  value={providerNote}
                  onChange={(e) => setProviderNote(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleUpdateStatus('in-progress')}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : '▶ Start Work (Move to In-Progress)'}
              </button>
            </div>
          )}

          {/* Workflow step 2: In-Progress -> Complete */}
          {request.status === 'in-progress' && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', marginBottom: 12 }}>
                To mark this request as <strong>Completed</strong>, please provide resolution notes
                describing what repairs were conducted:
              </p>
              <div className="form-group">
                <label className="form-label">Resolution Notes *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Explain what was repaired, replaced, or adjusted..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleUpdateStatus('completed')}
                disabled={actionLoading || !resolutionNotes.trim()}
              >
                {actionLoading ? 'Completing...' : '✓ Mark Request as Completed'}
              </button>
            </div>
          )}

          {/* Already completed */}
          {request.status === 'completed' && (
            <div style={{ marginTop: 8, color: 'var(--success)', fontWeight: 600 }}>
              ✓ Job finished! This service request is closed.
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------------------
          ASSIGNMENT PANEL (If request is pending, allow assigning provider)
          ----------------------------------------------------------------------- */}
      {request.status === 'pending' && (
        <div className="card" style={{ padding: 24, marginBottom: 24, background: '#fdfbf7', border: '1px solid #fed7aa' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#9a3412', marginBottom: 8 }}>
            ⚡ Assign Service Provider
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#c2410c', marginBottom: 16 }}>
            This request is currently in <strong>'pending'</strong> status. Assign an expert to transition it to <strong>'assigned'</strong>.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ maxWidth: 360 }}
              value={selectedProviderToAssign}
              onChange={(e) => setSelectedProviderToAssign(e.target.value)}
            >
              <option value="">Choose an available specialist...</option>
              {availableProviders.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.specialization.toUpperCase()}) — 📞 {p.phone}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAssignProvider}
              disabled={actionLoading || !selectedProviderToAssign}
            >
              Assign Provider →
            </button>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          STATUS HISTORY AUDIT TRAIL
          ----------------------------------------------------------------------- */}
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 18 }}>
          📜 Audit Trail & Timeline History
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 20 }}>
          Every status transition is logged with timestamp, user ID, and transition notes for accountability.
        </p>

        {request.statusHistory && request.statusHistory.length > 0 ? (
          <ul className="timeline">
            {request.statusHistory.map((item, idx) => (
              <li key={idx} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-title">
                  Status changed to <span style={{ textTransform: 'uppercase', color: 'var(--primary)' }}>{item.status}</span>
                </div>
                <div className="timeline-time">
                  🕒 {new Date(item.updatedAt).toLocaleString()}
                </div>
                {item.note && <div className="timeline-note">{item.note}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No history entries logged yet.</p>
        )}
      </div>
    </div>
  );
}

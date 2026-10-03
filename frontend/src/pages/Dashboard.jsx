/**
 * ==============================================================================
 * DASHBOARD PAGE (Customer & Provider Unified View)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * Notice how this single component adapts based on `user.role`:
 * - If user is CUSTOMER:
 *   Calls `GET /api/requests/my` -> Express returns ONLY requests created by this customer.
 * - If user is PROVIDER:
 *   Calls `GET /api/requests/my` -> Express returns ONLY requests assigned to this provider.
 * - The frontend is simple and declarative; security is enforced on the Express backend!
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard({ setCurrentView, setSelectedRequestId }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const filter = statusFilter === 'all' ? '' : statusFilter;
      const res = await api.requests.getMy(filter);
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Quick stats calculation
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    assigned: requests.filter((r) => r.status === 'assigned').length,
    inProgress: requests.filter((r) => r.status === 'in-progress').length,
    completed: requests.filter((r) => r.status === 'completed').length
  };

  const handleViewDetails = (id) => {
    setSelectedRequestId(id);
    setCurrentView('details');
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)' }}>
            {user.role === 'customer'
              ? 'My Service Requests'
              : user.role === 'provider'
              ? `Assigned Requests (${user.specialization.toUpperCase()})`
              : 'All System Service Requests'}
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: 4 }}>
            {user.role === 'customer'
              ? 'Raise new home-service tickets and track their live progress.'
              : 'Update progress and resolve service requests assigned to your queue.'}
          </p>
        </div>

        {user.role === 'customer' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCurrentView('create')}
          >
            + Raise Service Request
          </button>
        )}
      </div>

      {/* Security / Authorization Info Banner */}
      <div className="alert alert-info">
        <span>🛡️</span>
        <div>
          <strong>Backend Authorization Active:</strong>{' '}
          {user.role === 'customer'
            ? 'Ownership-Based Control strictly restricts view access. You can only view requests raised by your account.'
            : 'Role & Ownership Control active. You can only view and update requests assigned directly to you.'}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Requests</div>
            <div className="stat-val">{stats.total}</div>
          </div>
          <span style={{ fontSize: '2rem' }}>📋</span>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Assignment</div>
            <div className="stat-val" style={{ color: '#b45309' }}>{stats.pending}</div>
          </div>
          <span style={{ fontSize: '2rem' }}>⏳</span>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">In Progress</div>
            <div className="stat-val" style={{ color: '#a21caf' }}>{stats.inProgress}</div>
          </div>
          <span style={{ fontSize: '2rem' }}>🔧</span>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Completed</div>
            <div className="stat-val" style={{ color: '#047857' }}>{stats.completed}</div>
          </div>
          <span style={{ fontSize: '2rem' }}>✅</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Requests' },
          { key: 'pending', label: 'Pending' },
          { key: 'assigned', label: 'Assigned' },
          { key: 'in-progress', label: 'In Progress' },
          { key: 'completed', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">⚠️ {error}</div>}

      {/* Requests Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
            Loading requests from Express REST API...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--gray-800)', fontWeight: 700 }}>
              No Service Requests Found
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: 4 }}>
              {user.role === 'customer'
                ? 'You have not raised any service requests yet.'
                : 'No requests currently assigned to your queue.'}
            </p>
            {user.role === 'customer' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => setCurrentView('create')}
              >
                Raise Your First Request
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Request Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>{user.role === 'provider' ? 'Customer' : 'Assigned Provider'}</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                        {req.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', maxWidth: 280, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {req.description}
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {req.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            req.priority === 'urgent'
                              ? 'var(--danger-bg)'
                              : req.priority === 'high'
                              ? 'var(--warning-bg)'
                              : 'var(--gray-100)',
                          color:
                            req.priority === 'urgent'
                              ? 'var(--danger)'
                              : req.priority === 'high'
                              ? '#b45309'
                              : 'var(--gray-700)'
                        }}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      {user.role === 'provider' ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{req.customer?.name || 'Customer'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            📞 {req.customerPhone || req.customer?.phone}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {req.serviceProvider ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{req.serviceProvider.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                🛠️ {req.serviceProvider.specialization}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                              Unassigned
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleViewDetails(req._id)}
                      >
                        View & Track →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

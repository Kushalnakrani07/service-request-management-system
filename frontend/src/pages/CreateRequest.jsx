/**
 * ==============================================================================
 * CREATE SERVICE REQUEST PAGE (Add Form)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * Handles Customer raising a new service request:
 * 1. Collects form fields with controlled React inputs (`value` + `onChange`).
 * 2. Fetches available providers via `GET /api/requests/meta/providers` so customer
 *    or admin can optionally select an expert directly.
 * 3. Sends POST request to `/api/requests`.
 * 4. Navigates back to Dashboard on success.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function CreateRequest({ setCurrentView, setSelectedRequestId }) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('plumbing');
  const [priority, setPriority] = useState('medium');
  const [serviceAddress, setServiceAddress] = useState(user?.address || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [assignedProviderId, setAssignedProviderId] = useState('');

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available providers based on selected category
  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await api.requests.getProviders(category);
        if (res.success) {
          setProviders(res.data);
        }
      } catch (err) {
        console.error('Failed to load providers:', err.message);
      }
    }
    loadProviders();
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        category,
        priority,
        serviceAddress,
        customerPhone,
        assignedProviderId: assignedProviderId || undefined
      };

      const res = await api.requests.create(payload);
      if (res.success) {
        setSelectedRequestId(res.data._id);
        setCurrentView('details');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '30px 20px', maxWidth: 760 }}>
      {/* Back button */}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        style={{ marginBottom: 20 }}
        onClick={() => setCurrentView('dashboard')}
      >
        ← Back to Dashboard
      </button>

      <div className="card" style={{ padding: 36 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)' }}>
            Raise a New Service Request
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: 4 }}>
            Fill in the details below. Our system will validate your data and route it to a service provider.
          </p>
        </div>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Issue Title / Subject *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Leaking kitchen tap, tripping circuit breaker"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Priority Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Service Category *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="carpentry">Carpentry</option>
                <option value="ac-repair">AC Repair</option>
                <option value="appliance">Appliance Repair</option>
                <option value="painting">Painting</option>
                <option value="cleaning">Cleaning</option>
                <option value="general">General Handyman</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low (Routine maintenance)</option>
                <option value="medium">Medium (Standard issue)</option>
                <option value="high">High (Urgent attention)</option>
                <option value="urgent">Urgent (Emergency)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description of the Problem *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Explain the problem in detail (e.g. when it started, symptoms, exact location in house)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Address & Contact Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Service Location / Address *</label>
              <input
                type="text"
                className="form-input"
                placeholder="House / Flat No., Society / Street"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Optional Direct Assignment */}
          <div className="form-group">
            <label className="form-label">
              Assign to Specialist Provider (Optional)
            </label>
            <select
              className="form-select"
              value={assignedProviderId}
              onChange={(e) => setAssignedProviderId(e.target.value)}
            >
              <option value="">Leave Unassigned (System / Dispatch will assign)</option>
              {providers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.specialization.toUpperCase()} (📞 {p.phone})
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>
              If a provider is chosen, status automatically moves to <strong>'assigned'</strong>.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCurrentView('dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Service Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

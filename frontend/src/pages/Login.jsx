/**
 * ==============================================================================
 * AUTHENTICATION PAGE (Login & Registration)
 * ==============================================================================
 * 
 * Provides:
 * 1. Clean form to Login or Register as a Customer or Service Provider.
 * 2. Instant Demo Login Buttons to facilitate viva/evaluation testing.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register, quickLoginAs } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('customer');
  const [specialization, setSpecialization] = useState('plumbing');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name,
          email,
          password,
          role,
          phone,
          address,
          specialization: role === 'provider' ? specialization : undefined
        });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      await quickLoginAs(demoEmail);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: 36 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              marginBottom: 12
            }}
          >
            🛠️
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)' }}>
            {isRegister ? 'Create an Account' : 'Welcome to ServiceDesk'}
          </h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: 4 }}>
            {isRegister
              ? 'Join as a Customer or registered Service Provider'
              : 'Sign in to manage and track home-service requests'}
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div style={{ background: 'var(--gray-50)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', marginBottom: 8 }}>
            ⚡ 1-Click Evaluation Accounts (Pre-seeded):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickDemo('customer@example.com')}
              disabled={loading}
            >
              👤 Customer (Kavya)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickDemo('rohit@example.com')}
              disabled={loading}
            >
              👤 Customer 2 (Rohit)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickDemo('plumber@example.com')}
              disabled={loading}
            >
              🔧 Plumber (Rajesh)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickDemo('electrician@example.com')}
              disabled={loading}
            >
              ⚡ Electrician (Amit)
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="customer">Customer (Raise & View My Requests)</option>
                  <option value="provider">Service Provider (Fulfill & Update Requests)</option>
                </select>
              </div>

              {role === 'provider' && (
                <div className="form-group">
                  <label className="form-label">Trade / Specialization</label>
                  <select
                    className="form-select"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
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
              )}

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address / Service Area</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Flat/Street, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setIsRegister(false)}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to ServiceDesk?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setIsRegister(true)}
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

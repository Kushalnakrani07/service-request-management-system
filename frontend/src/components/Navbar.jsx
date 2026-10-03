/**
 * ==============================================================================
 * NAVBAR COMPONENT
 * ==============================================================================
 * 
 * Includes top brand bar, user session badge, navigation actions,
 * and a Professor Demo Quick Switcher bar!
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout, quickLoginAs } = useAuth();

  const handleDemoSwitch = async (email) => {
    try {
      await quickLoginAs(email);
      setCurrentView('dashboard');
    } catch (err) {
      alert(`Demo login error: ${err.message}`);
    }
  };

  return (
    <header>
      {/* Quick Demo Switcher Bar (Ideal for Professor Live Evaluation) */}
      <div className="demo-banner">
        <div>
          <strong>⚡ Quick Demo Switcher:</strong> Click any demo persona to switch roles instantly:
        </div>
        <div className="demo-pills">
          <button
            type="button"
            className="demo-pill"
            onClick={() => handleDemoSwitch('customer@example.com')}
          >
            👤 Customer (Kavya)
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => handleDemoSwitch('rohit@example.com')}
          >
            👤 Customer 2 (Rohit)
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => handleDemoSwitch('plumber@example.com')}
          >
            🔧 Plumber (Rajesh)
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => handleDemoSwitch('electrician@example.com')}
          >
            ⚡ Electrician (Amit)
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => handleDemoSwitch('admin@example.com')}
          >
            🛡️ Admin Supervisor
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="container nav-inner">
          <div
            className="brand"
            style={{ cursor: 'pointer' }}
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="brand-icon">🛠️</div>
            <div>
              <div style={{ fontSize: '1.05rem', lineHeight: 1.2 }}>Service Desk</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 500 }}>
                ITM Skills University • B.Tech CSE
              </div>
            </div>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <button
                  type="button"
                  className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setCurrentView('dashboard')}
                >
                  📊 Dashboard
                </button>

                {user.role === 'customer' && (
                  <button
                    type="button"
                    className={`btn btn-sm ${currentView === 'create' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setCurrentView('create')}
                  >
                    + Raise Request
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                      {user.name}
                    </div>
                    <span className="badge badge-role">
                      {user.role === 'provider' ? `Provider (${user.specialization})` : user.role}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                    onClick={logout}
                    title="Log out of current session"
                  >
                    Log Out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}

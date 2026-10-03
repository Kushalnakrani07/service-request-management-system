/**
 * ==============================================================================
 * MAIN APPLICATION CONTAINER (App.jsx)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * App.jsx coordinates our top-level navigation:
 * - If user is not authenticated: renders Login / Register screen.
 * - If user is authenticated: renders the Navbar and the active view:
 *   - 'dashboard': Main request list and stats.
 *   - 'create': Form to raise a new request.
 *   - 'details': Single request detail with workflow tracker and provider actions.
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateRequest from './pages/CreateRequest';
import RequestDetails from './pages/RequestDetails';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'create' | 'details'
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🛠️</div>
          <div>Loading ServiceDesk System...</div>
        </div>
      </div>
    );
  }

  // If not logged in, render the Login / Register screen
  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && (
          <Dashboard
            setCurrentView={setCurrentView}
            setSelectedRequestId={setSelectedRequestId}
          />
        )}

        {currentView === 'create' && (
          <CreateRequest
            setCurrentView={setCurrentView}
            setSelectedRequestId={setSelectedRequestId}
          />
        )}

        {currentView === 'details' && (
          <RequestDetails
            requestId={selectedRequestId}
            setCurrentView={setCurrentView}
          />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--gray-200)', background: 'white', padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
        ITM Skills University • B.Tech Computer Science Engineering • Backend Development Project
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

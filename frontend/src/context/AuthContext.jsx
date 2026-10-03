/**
 * ==============================================================================
 * AUTHENTICATION CONTEXT (Global User Session State)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * What is React Context?
 * In React, data normally flows downwards via "props" (Parent -> Child -> Grandchild).
 * When multiple components across the whole app need to know "Who is logged in?",
 * passing props down 5 levels is tedious and messy (known as "prop drilling").
 * 
 * Context solves this! It acts as a global broadcast tower:
 * 1. AuthContext: Holds the user and token data.
 * 2. AuthProvider: Wraps our entire application and supplies the values.
 * 3. useAuth(): A custom hook so any child component can grab user info with 1 line:
 *    const { user, login, logout } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sr_token'));
  const [loading, setLoading] = useState(true);

  // Check if token exists on initial page load and fetch user profile
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success) {
            setUser(res.user);
          }
        } catch (err) {
          console.error('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success) {
      localStorage.setItem('sr_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
  };

  // Register handler
  const register = async (userData) => {
    const res = await api.auth.register(userData);
    if (res.success) {
      localStorage.setItem('sr_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('sr_token');
    setToken(null);
    setUser(null);
  };

  // Quick Switcher (Convenient helper for live Professor Demo)
  const quickLoginAs = async (email) => {
    return login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isProvider: user?.role === 'provider',
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        quickLoginAs
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

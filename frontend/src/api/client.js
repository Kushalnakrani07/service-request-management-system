/**
 * ==============================================================================
 * API CLIENT SERVICE (Centralized HTTP Request Layer)
 * ==============================================================================
 * 
 * CONCEPT EXPLANATION FOR BEGINNERS:
 * Why do we centralize API calls instead of calling `fetch()` randomly in components?
 * 1. Single Responsibility: Every network call goes through one predictable place.
 * 2. Token Injection: Automatically attaches `Authorization: Bearer <token>` to requests.
 * 3. Consistent Error Handling: Parses backend error JSON and throws clean error messages.
 * 4. Easy Config: If backend URL changes, you only update it here!
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Universal helper that performs HTTP requests and handles auth headers.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sr_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // If a JWT token exists in localStorage, send it in Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // If backend returned 4xx or 5xx, extract the error message
    const errorMsg = data.message || (data.errors && data.errors.join(', ')) || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication Endpoints
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),

    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),

    getMe: () => request('/auth/me')
  },

  // Service Request Endpoints
  requests: {
    // Get personal requests (Customer sees own; Provider sees assigned)
    getMy: (status) => {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      return request(`/requests/my${query}`);
    },

    // Get single request by ID
    getById: (id) => request(`/requests/${id}`),

    // Create a new request (Customer only)
    create: (requestData) =>
      request('/requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      }),

    // Update request status (Provider only: assigned -> in-progress -> completed)
    updateStatus: (id, statusData) =>
      request(`/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData)
      }),

    // Assign request to a service provider
    assign: (id, providerId) =>
      request(`/requests/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ providerId })
      }),

    // Get all requests (Admin or dispatch)
    getAll: (params = '') => request(`/requests${params}`),

    // Get available service providers
    getProviders: (specialization) => {
      const query = specialization ? `?specialization=${encodeURIComponent(specialization)}` : '';
      return request(`/requests/meta/providers${query}`);
    }
  }
};

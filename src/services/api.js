import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Users endpoints
export const users = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getRiskHistory: (id) => api.get(`/users/${id}/risk-history`),
  evaluate: (id) => api.post(`/risk/evaluate/${id}`),
};

// Alerts endpoints
export const alerts = {
  getAll: (params) => api.get('/alerts', { params }),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  investigate: (id) => api.put(`/alerts/${id}/investigate`),
};

// Logs endpoints
export const logs = {
  addLogin: (data) => api.post('/logs/login', data),
  addFile: (data) => api.post('/logs/file', data),
  addUSB: (data) => api.post('/logs/usb', data),
  addPrivilege: (data) => api.post('/logs/privilege', data),
};

// Dashboard endpoints
export const dashboard = {
  getStats: () => api.get('/dashboard/stats'),
  getRiskTrends: () => api.get('/dashboard/risk-trends'),
  getTopRiskyUsers: () => api.get('/dashboard/top-risky-users'),
  getAlertsDistribution: () => api.get('/dashboard/alerts-distribution'),
  getHourlyActivity: () => api.get('/dashboard/hourly-activity'),
};

export default api;

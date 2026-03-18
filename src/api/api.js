import axios from 'axios';
import { getToken, clearAuth } from '../utils/auth.js';
import { getLocationSlug } from '../utils/location.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const locationSlug = getLocationSlug();
  if (locationSlug && locationSlug !== 'all') {
    config.headers['x-location'] = locationSlug;
  }
  return config;
});

// Automatic Session Reset on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or invalid token - Clearing session');
      clearAuth();
      // Optional: Notify user or redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;

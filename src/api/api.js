import axios from 'axios';
import { getToken, clearAuth } from '../utils/auth.js';
import { getLocationSlug } from '../utils/location.js';

export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000/api' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');
export const BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};

const api = axios.create({
  baseURL: API_BASE_URL
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

  const selectedBranchId = localStorage.getItem('selectedBranch');
  if (selectedBranchId && selectedBranchId !== 'all') {
    config.headers['x-location-id'] = selectedBranchId;
  }

  const systemMode = localStorage.getItem('systemMode') || 'live';
  config.headers['x-system-mode'] = systemMode;

  return config;
});

// Automatic Session Reset on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear session if it's not a login/register attempt
    const isAuthPath = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthPath) {
      console.warn('Session expired or invalid token - Clearing session');
      clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;

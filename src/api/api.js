import axios from 'axios';
import { getToken } from '../utils/auth.js';
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

export default api;

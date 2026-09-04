import axios from "axios";

/**
 * Resolves and normalizes the backend API base URL for Admin Dashboard.
 * 
 * Supports:
 * - VITE_API_URL = "http://localhost:5000/api/v1" -> "http://localhost:5000/api/v1"
 * - VITE_API_URL = "https://<render-domain>.onrender.com" -> "https://<render-domain>.onrender.com/api/v1"
 * - VITE_API_URL = "https://<render-domain>.onrender.com/api/v1/" -> "https://<render-domain>.onrender.com/api/v1"
 * - Local Dev fallback (when VITE_API_URL is unset in dev) -> "http://localhost:5000/api/v1"
 * - Production warning/guard if VITE_API_URL is missing
 */
export const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL;

  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') {
    let clean = rawUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api/v1')) {
      if (clean.endsWith('/api')) {
        clean = `${clean}/v1`;
      } else {
        clean = `${clean}/api/v1`;
      }
    }
    return clean;
  }

  // Local development fallback — use Vite proxy or port 5005
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return '/api/v1';
  }

  // Production configuration error logging (fail-fast without crashing module execution)
  console.error(
    '[RakshaSetu Admin Config Error] Missing VITE_API_URL in production environment. ' +
    'Please configure VITE_API_URL in your Vercel Project Settings (e.g. https://<your-render-backend>.onrender.com/api/v1).'
  );

  return '/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach JWT token for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = 
      localStorage.getItem("token") || 
      localStorage.getItem("rakshasetu_token") || 
      localStorage.getItem("rakshasetu_admin_token");
      
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error normalization and unwrapping
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data;
    const message = (typeof errorData === 'object' && errorData?.message) || (typeof errorData === 'string' && errorData) || error.message || 'Bad Request (400)';
    const customError = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    customError.response = error.response;
    customError.data = errorData;
    return Promise.reject(customError);
  }
);

export default api;
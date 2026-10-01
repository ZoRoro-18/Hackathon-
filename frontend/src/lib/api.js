import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  // In dev mode default to localhost:5000/api; in production default to same-origin /api
  return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('khaata_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Show exact backend error message in toast
    const backendMessage = error.response?.data?.error?.message;
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK';
    const fallbackMessage = isNetworkError 
      ? 'Cannot connect to backend server. Make sure the backend is running on port 5000.' 
      : (error.message || 'An unexpected error occurred');
    const message = backendMessage || fallbackMessage;

    // Do not show toast for silent 401s on GET /auth/me
    const isMeCheck = error.config?.url?.includes('/auth/me');
    if (!(error.response?.status === 401 && isMeCheck)) {
      toast.error(message, { id: 'api-error' });
    }

    if (error.response?.status === 401 && !isMeCheck) {
      localStorage.removeItem('khaata_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api` 
    : 'http://localhost:5000/api',
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
    const fallbackMessage = error.message || 'Network error connecting to backend';
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

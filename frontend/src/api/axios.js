import axios from 'axios';

const normalizeApiBaseUrl = (rawBaseUrl) => {
  const trimmed = (rawBaseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const resolvedBaseURL = (() => {
  const envBase = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
  if (envBase) return envBase;

  // Sin variable en local: usar backend local.
  if (import.meta.env.DEV) return 'http://localhost:5000/api';

  // En Vercel, si desplegas frontend+backend juntos con vercel.json,
  // el backend queda disponible en el mismo dominio bajo /api.
  return '/api';
})();

const api = axios.create({
  baseURL: resolvedBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('barberia-auth');
  if (auth) {
    const parsed = JSON.parse(auth);
    const token = parsed?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('barberia-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

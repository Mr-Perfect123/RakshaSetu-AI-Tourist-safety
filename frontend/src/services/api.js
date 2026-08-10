import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rakshasetu_tourist_token') || localStorage.getItem('rakshasetu_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('rakshasetu_tourist_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
          if (res.data && res.data.data && res.data.data.accessToken) {
            const newToken = res.data.data.accessToken;
            localStorage.setItem('rakshasetu_tourist_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('rakshasetu_tourist_token');
          localStorage.removeItem('rakshasetu_tourist_refresh_token');
          localStorage.removeItem('rakshasetu_tourist_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;

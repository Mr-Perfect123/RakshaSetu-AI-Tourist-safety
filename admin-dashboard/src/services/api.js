import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rakshasetu_token');
    if (token && token !== 'undefined' && token !== 'null' && token !== 'demo_token') {
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
      const refreshToken = localStorage.getItem('rakshasetu_refresh_token');

      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        try {
          const res = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
          const responseData = res.data;
          const newToken = responseData?.data?.accessToken || responseData?.accessToken;

          if (newToken) {
            localStorage.setItem('rakshasetu_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('rakshasetu_token');
          localStorage.removeItem('rakshasetu_refresh_token');
          localStorage.removeItem('rakshasetu_user');
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

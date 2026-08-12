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
    if (token && token !== 'undefined' && token !== 'null') {
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
      const refreshToken = localStorage.getItem('rakshasetu_tourist_refresh_token') || localStorage.getItem('rakshasetu_refresh_token');

      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        try {
          const res = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
          const responseData = res.data;
          const newToken = responseData?.data?.accessToken || responseData?.accessToken;

          if (newToken) {
            localStorage.setItem('rakshasetu_tourist_token', newToken);
            localStorage.setItem('rakshasetu_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('rakshasetu_tourist_token');
          localStorage.removeItem('rakshasetu_tourist_refresh_token');
          localStorage.removeItem('rakshasetu_tourist_user');
          localStorage.removeItem('rakshasetu_token');
          localStorage.removeItem('rakshasetu_refresh_token');
          localStorage.removeItem('rakshasetu_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    const errorData = error.response?.data;
    const message = (typeof errorData === 'object' && errorData?.message) || (typeof errorData === 'string' && errorData) || error.message || 'Bad Request (400)';
    const customError = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    customError.response = error.response;
    customError.data = errorData;
    return Promise.reject(customError);
  }
);

export default api;

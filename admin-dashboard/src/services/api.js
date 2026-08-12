import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1"
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("rakshasetu_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
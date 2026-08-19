import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT accessToken
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('stationery-auth');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state?.accessToken) {
            config.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 & token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const authStorage = localStorage.getItem('stationery-auth');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const refreshToken = parsed?.state?.refreshToken;
          if (refreshToken) {
            const refreshRes = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            const newAccessToken = refreshRes.data?.data?.accessToken;
            if (newAccessToken) {
              parsed.state.accessToken = newAccessToken;
              localStorage.setItem('stationery-auth', JSON.stringify(parsed));
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            }
          }
        }
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('stationery-auth');
          window.location.href = '/auth/login';
        }
      }
    }

    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

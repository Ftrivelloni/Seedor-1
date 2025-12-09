import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'seedor_access_token';
const REFRESH_TOKEN_KEY = 'seedor_refresh_token';

// Token management functions
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasValidToken: (): boolean => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear tokens and redirect to login
      tokenStorage.clearTokens();

      // Dispatch custom event for auth state change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('seedor:auth-error', { detail: { status: 401 } }));
      }

      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('seedor:auth-error', { detail: { status: 403 } }));
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;

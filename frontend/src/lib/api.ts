import axios from 'axios';
import axiosRetry from 'axios-retry';
import { secureStorage } from './secureStorage';

// Get API base URL from environment variable
// If not set, default to empty string to use relative path (proxied by Vite)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable sending cookies
});

// Configure retry logic with exponential backoff
axiosRetry(api, {
    retries: 3, // Retry failed requests up to 3 times
    retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
    retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error)
            || error.response?.status === 429 // Also retry on rate limit
            || (error.response?.status || 0) >= 500;
    },
    onRetry: (retryCount, _error, requestConfig) => {
        console.log(`Retrying request (${retryCount}/3):`, requestConfig.url);
    }
});

// Request interceptor - no longer need to add API key from storage for admin
// Cookies are sent automatically with withCredentials: true
api.interceptors.request.use((config) => {
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Queue for requests that fail while refreshing token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor for logging, error handling, and token refresh
api.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
            console.log(`✓ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Log errors
        if (error.response) {
            console.error(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}`, error.response.data);
        } else if (error.request) {
            console.error('Network error - no response received:', error.message);
        } else {
            console.error('Request error:', error.message);
        }

        // Handle 401 Unauthorized - Token Refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh')) {

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Attempt to refresh token
                await api.post('/auth/refresh');

                // Process queued requests
                processQueue(null);
                isRefreshing = false;

                // Retry original request
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                // If refresh fails, user needs to login again
                // We'll let the app handle the redirect based on the error or AuthContext
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Check if admin key is set in secure storage (legacy)
export const hasAdminKey = () => secureStorage.hasItem('api_admin_key');

// Authentication Methods
export const register = async (email: string, password: string) => {
    const res = await api.post('/auth/register', { email, password });
    return res.data;
};

export const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
};

export const logout = async () => {
    const res = await api.post('/auth/logout');
    return res.data;
};

export const getCurrentUser = async () => {
    const res = await api.get('/auth/me');
    return res.data;
};

export const refreshToken = async () => {
    const res = await api.post('/auth/refresh');
    return res.data;
};

// Admin Methods
export const generateKey = async (name: string) => {
    const res = await api.post('/admin/keys', { name });
    return res.data;
};

export const listKeys = async () => {
    const res = await api.get('/admin/keys');
    return res.data;
};

export const revokeKey = async (keyId: number) => {
    const res = await api.delete(`/admin/keys/${keyId}`);
    return res.data;
};

export const getStats = async (duration: string = "24h") => {
    const res = await api.get('/admin/stats', { params: { duration } });
    return res.data;
};

export const getPnlHistory = async (user: string, builderOnly = true) => {
    // Determine base URL dynamically or fallback to localhost
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // We assume the stored key is valid or user provides one. 
    // Ideally, for the demo page, the user provides the key in the input. 
    // But this API helper often uses the 'stored' key.
    // For the DEMO context, we might pass the key as an argument or rely on the caller to set headers.
    // Let's rely on api.get() interceptors if we are logged in, OR we might need a custom call if we are just "demoing" without login.
    // Since Demo.tsx uses direct axios, we will add these helpers primarily for Authenticated/Dashboard usage, 
    // OR we make them accept an optional apiKey param.

    // Actually, following existing pattern:
    const response = await api.get('/v1/pnl/history', {
        params: { user, builderOnly }
    });
    return response.data;
};

export const getLeaderboard = async (metric = 'pnl') => {
    // Leaderboard is public-ish but behind auth usually? 
    // The endpoint definition didn't enforce VerifyAPIKey on leaderboard... wait.
    // main.py: @app.get("/v1/leaderboard") -- no dependency! It is public.
    const response = await api.get('/v1/leaderboard', {
        params: { metric }
    });
    return response.data;
};

export async function getRecentActivity(limit: number = 10) {
    const response = await api.get('/admin/activity', {
        params: { limit }
    });
    return response.data;
};

export const updateSetting = async (key: string, value: string) => {
    const res = await api.post('/admin/settings', { key, value });
    return res.data;
};

export const getSettings = async () => {
    const res = await api.get('/admin/settings');
    return res.data;
};

// Public Methods (for demo, using demo key or passthrough)
export const getPnL = async (user: string, apiKey: string) => {
    const res = await api.get('/v1/pnl', {
        params: { user, builderOnly: true },
        headers: { 'X-API-Key': apiKey }
    });
    return res.data;
};

export const getPnLHistory = async (user: string, apiKey: string) => {
    const res = await api.get('/v1/pnl/history', {
        params: { user, builderOnly: true },
        headers: { 'X-API-Key': apiKey }
    });
    return res.data;
};

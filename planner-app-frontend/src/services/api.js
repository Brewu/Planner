import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5108/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
    timeout: 30000, // increased from 10s to 30s
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            toast.error('Request timeout - please try again');
        } else if (error.response) {
            const data = error.response.data;
            let errorMessage = 'An error occurred';

            if (error.response.status === 401) {
                errorMessage = 'Session expired. Please login again.';
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else if (typeof data === 'string' && data.length > 0) {
                errorMessage = data;
            } else if (data?.message) {
                errorMessage = data.message;
            } else if (data?.title) {
                const errs = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : null;
                errorMessage = errs || data.title;
            } else if (error.response.status === 403) {
                errorMessage = 'You do not have permission to perform this action';
            } else if (error.response.status === 404) {
                errorMessage = 'Resource not found';
            } else if (error.response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }

            toast.error(String(errorMessage));
        } else if (error.request) {
            toast.error('Cannot connect to server. Please check if backend is running.');
        } else {
            toast.error('An unexpected error occurred');
        }

        return Promise.reject(error);
    }
    
);

export const authAPI = {
    register: (userData) => api.post('/Auth/register', userData),
    login: (credentials) => api.post('/Auth/login', credentials),
    googleLogin: (idToken) => api.post('/Auth/google-login', { idToken }),
    getCurrentUser: () => api.get('/Auth/me'),  // Add this line

};

export default api;
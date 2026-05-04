import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5108/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        console.log(`Response from ${response.config.url}:`, response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth services
export const authService = {
    login: async (staffId, password) => {
        try {
            const response = await api.post('/auth/login', { staffId, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                // Decode token to get user info
                try {
                    const tokenData = JSON.parse(atob(response.data.token.split('.')[1]));
                    localStorage.setItem('user', JSON.stringify({
                        id: tokenData.nameid,
                        name: tokenData.unique_name
                    }));
                } catch (e) {
                    console.error('Failed to decode token:', e);
                }
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    getToken: () => localStorage.getItem('token'),
};

// User management services
export const userService = {
    registerUser: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    registerBulk: async (usersData) => {
        const response = await api.post('/auth/register/bulk', usersData);
        return response.data;
    },

    getAllUsers: async () => {
        const response = await api.get('/users');
        return response.data;
    },
};

export default api; 
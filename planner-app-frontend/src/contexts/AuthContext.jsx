import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({
                    id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
                    name: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
                });
            } catch {
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (staffId, password) => {
        try {
            const response = await authAPI.login({ staffId, password });
            const { token } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            toast.success('Welcome back!');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.response?.data || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const { token } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            toast.success('Account created successfully!');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.response?.data || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{
            user, loading, login, register, logout,
            isAuthenticated: !!token,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
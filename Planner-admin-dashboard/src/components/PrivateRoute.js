import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api';

const PrivateRoute = ({ children }) => {
    const token = authService.getToken();

    if (!token) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default PrivateRoute;
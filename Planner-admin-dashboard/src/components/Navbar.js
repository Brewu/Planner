import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <h1 className="text-xl font-bold text-gray-800">Planner App Admin</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">
                            Welcome, {user?.name || 'Admin'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
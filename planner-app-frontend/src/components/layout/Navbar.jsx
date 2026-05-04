import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import usePendingRequests from '../hooks/UsependingRequests';
import CalendarModal from '../calendar/CalendarModal';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const pendingCount = usePendingRequests();
    const [showCalendar, setShowCalendar] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-blue-600">Planner</span>
                            </Link>

                            {isAuthenticated && (
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <Link
                                        to="/dashboard"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/boards"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Boards
                                    </Link>
                                    <Link
                                        to="/requests"
                                        className="relative border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Requests
                                        {pendingCount > 0 && (
                                            <span className="absolute -top-0.5 -right-4 h-5 w-5 rounded-full bg-red-500 text-xs text-white font-medium flex items-center justify-center">
                                                {pendingCount > 9 ? '9+' : pendingCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/team"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        My Team
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            {isAuthenticated && (
                                <>
                                    {/* Calendar button */}
                                    <button
                                        onClick={() => setShowCalendar(true)}
                                        className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Task Calendar"
                                    >
                                        <CalendarDaysIcon className="h-6 w-6" />
                                    </button>

                                    <NotificationBell />
                                </>
                            )}

                            {isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-700">
                                        Welcome, {user?.name}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="space-x-4">
                                    <Link
                                    >
                                    </Link>
                                  
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Calendar overlay — rendered outside nav so it covers the full page */}
            {showCalendar && (
                <CalendarModal onClose={() => setShowCalendar(false)} />
            )}
        </>
    );
};

export default Navbar;
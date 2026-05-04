import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/layout/Navbar';
import UserProfile from './components/profile/UserProfile';
import { BoardProvider } from './contexts/BoardContext';
import Boards from './components/boards/Boards';
import TeamManagement from './components/supervisor/TeamManagement';
import { TaskProvider } from './contexts/TaskContext';
import Tasks from './components/tasks/Tasks';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationsPage from './components/notifications/NotificationsPage';
import Dashboard from './components/dashboard/Dashboard';
import SupervisorRequests from './components/supervisor/SupervisorRequests';
import { ReportProvider } from './contexts/ReportContext';

// Remove the placeholder Dashboard component and use the real one
// Placeholder components for protected routes (only for ones not implemented yet)

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <Router>
                <AuthProvider>
                    <BoardProvider>
                        <TaskProvider>
                            <NotificationProvider>  {/* Add this */}
                                <ReportProvider>
                                    <div className="min-h-screen bg-gray-100">
                                        <Navbar />
                                        <Toaster position="top-right" />

                                        <Routes>
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/register" element={<Register />} />
                                            <Route path="/requests" element={<SupervisorRequests />} />

                                            <Route
                                                path="/dashboard"
                                                element={
                                                    <ProtectedRoute>
                                                        <Dashboard />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/notifications"
                                                element={
                                                    <ProtectedRoute>
                                                        <NotificationsPage />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            <Route
                                                path="/profile"
                                                element={
                                                    <ProtectedRoute>
                                                        <UserProfile />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            <Route
                                                path="/team"
                                                element={
                                                    <ProtectedRoute>
                                                        <TeamManagement />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            <Route
                                                path="/boards/:boardId/tasks"
                                                element={
                                                    <ProtectedRoute>
                                                        <Tasks />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/boards"
                                                element={
                                                    <ProtectedRoute>
                                                        <Boards />
                                                    </ProtectedRoute>
                                                }
                                            />


                                            <Route
                                                path="/tasks"
                                                element={
                                                    <ProtectedRoute>
                                                        <Tasks />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                        </Routes>
                                    </div>
                                </ReportProvider>
                            </NotificationProvider>  {/* Add this */}

                        </TaskProvider>
                    </BoardProvider>
                </AuthProvider>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;
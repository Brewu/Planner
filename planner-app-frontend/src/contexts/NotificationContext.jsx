import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            connectToSignalR();
            fetchNotifications();
        } else {
            disconnectFromSignalR();
        }

        return () => {
            disconnectFromSignalR();
        };
    }, [isAuthenticated, user]);

    const connectToSignalR = async () => {
        await notificationService.startConnection(user.id);
        notificationService.onNotificationReceived(handleNewNotification);
    };

    const disconnectFromSignalR = () => {
        notificationService.stopConnection();
    };

    const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast for new notification
        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t.id);
                    handleNotificationClick(notification);
                }}
                className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer hover:bg-gray-50`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                {notification.message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-gray-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss(t.id);
                        }}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                    >
                        Close
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleNotificationClick = (notification) => {
        // Mark as read when clicked
        markAsRead(notification.id);

        // Navigate based on notification type
        if (notification.boardId) {
            navigate(`/boards/${notification.boardId}/tasks`);
        } else if (notification.taskId) {
            navigate(`/tasks`);
        }

        setShowDropdown(false);
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications(user.id);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            // Update backend first
            await notificationService.markAsRead(notificationId);

            // Then update local state
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        try {
            // Update backend first
            await notificationService.markAllAsRead(user.id);

            // Then update local state
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);

            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const clearNotifications = async () => {
        if (!user) return;

        try {
            // Update backend first
            await notificationService.clearAll(user.id);

            // Then update local state
            setNotifications([]);
            setUnreadCount(0);

            toast.success('All notifications cleared');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            toast.error('Failed to clear notifications');
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            // Update backend first
            await notificationService.deleteNotification(notificationId);

            // Then update local state
            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            // Update unread count if the deleted notification was unread
            const deletedNotification = notifications.find(n => n.id === notificationId);
            if (deletedNotification && !deletedNotification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            toast.success('Notification deleted');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        showDropdown,
        setShowDropdown,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        deleteNotification,
        handleNotificationClick
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
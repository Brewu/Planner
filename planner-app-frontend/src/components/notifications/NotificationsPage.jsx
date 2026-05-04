import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
    BellIcon,
    CheckCircleIcon,
    DocumentArrowDownIcon,
    EnvelopeIcon,
    XMarkIcon,
    ArchiveBoxIcon,
    ArrowPathIcon,
    UserGroupIcon,
    CalendarIcon,
    SparklesIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        setShowReportModal,
        setCurrentReport
    } = useNotifications();
    const navigate = useNavigate();
    const [processingId, setProcessingId] = useState(null);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            await fetchNotifications();
        } catch (error) {
            console.error('Error loading notifications:', error);
            toast.error('Failed to load notifications');
        }
    };

    const handleNotificationClick = async (notification) => {
        if (processingId === notification.id) return;
        
        setProcessingId(notification.id);
        
        try {
            if (!notification.isRead) {
                await markAsRead(notification.id);
            }

            // Handle different notification types
            if (notification.type === 'Report' && notification.metadata) {
                setCurrentReport({
                    url: notification.metadata.reportUrl,
                    name: notification.metadata.reportName,
                    boardId: notification.metadata.boardId,
                    message: notification.message
                });
                setShowReportModal(true);
            } else if (notification.boardId) {
                navigate(`/boards/${notification.boardId}/tasks`);
            }
        } catch (error) {
            console.error('Error handling notification:', error);
            toast.error('Failed to process notification');
        } finally {
            setProcessingId(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all as read');
        }
    };

    const handleClearAll = async () => {
        setShowClearConfirm(false);
        try {
            await clearAllNotifications();
            toast.success('All notifications cleared');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            toast.error('Failed to clear notifications');
        }
    };

    const getNotificationIcon = (type) => {
        const iconMap = {
            'Report': { icon: DocumentArrowDownIcon, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            'TaskAssignment': { icon: EnvelopeIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
            'TaskComplete': { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' },
            'BoardUpdate': { icon: UserGroupIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
            'BoardComplete': { icon: SparklesIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
            'Reminder': { icon: CalendarIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
            'Overdue': { icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-100' }
        };
        
        const config = iconMap[type] || { icon: BellIcon, color: 'text-gray-600', bg: 'bg-gray-100' };
        const IconComponent = config.icon;
        
        return { 
            icon: <IconComponent className={`h-5 w-5 ${config.color}`} />,
            bg: config.bg
        };
    };

    const getRelativeTime = (date) => {
        try {
            const now = new Date();
            const notificationDate = new Date(date);
            const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
            
            if (diffInHours < 24) {
                return formatDistanceToNow(notificationDate, { addSuffix: true });
            } else {
                return format(notificationDate, 'MMM d, yyyy');
            }
        } catch {
            return 'Unknown date';
        }
    };

    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') {
            return notifications.filter(n => !n.isRead);
        }
        if (filter === 'read') {
            return notifications.filter(n => n.isRead);
        }
        return notifications;
    }, [notifications, filter]);

    const groupedNotifications = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);
        
        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            older: []
        };
        
        filteredNotifications.forEach(notification => {
            const date = new Date(notification.createdAt);
            date.setHours(0, 0, 0, 0);
            
            if (date.getTime() === today.getTime()) {
                groups.today.push(notification);
            } else if (date.getTime() === yesterday.getTime()) {
                groups.yesterday.push(notification);
            } else if (date > thisWeek) {
                groups.thisWeek.push(notification);
            } else {
                groups.older.push(notification);
            }
        });
        
        return groups;
    }, [filteredNotifications]);

    const groupLabels = {
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        older: 'Older'
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-sm text-gray-500">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                            <BellIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Stay updated with your latest activities
                            </p>
                        </div>
                    </div>
                    
                    {/* Stats Badge */}
                    {unreadCount > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-blue-100 rounded-full">
                                <span className="text-sm font-semibold text-blue-700">
                                    {unreadCount} unread
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter and Actions Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Filter Tabs */}
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        {[
                            { value: 'all', label: 'All', count: notifications.length },
                            { value: 'unread', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
                            { value: 'read', label: 'Read', count: notifications.filter(n => n.isRead).length }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                                    ${filter === option.value 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                {option.label}
                                {option.count > 0 && (
                                    <span className={`ml-1.5 text-xs ${filter === option.value ? 'text-blue-500' : 'text-gray-400'}`}>
                                        ({option.count})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <ArchiveBoxIcon className="h-4 w-4 mr-1.5" />
                                Clear all
                            </button>
                        )}
                        <button
                            onClick={loadNotifications}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Clear All Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Clear All Notifications?</h3>
                            <button onClick={() => setShowClearConfirm(false)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            This will permanently delete all your notifications. This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BellIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                        <p className="text-sm text-gray-500">
                            {filter === 'all' 
                                ? "You're all caught up! Check back later for updates."
                                : filter === 'unread' 
                                    ? "No unread notifications. You're all caught up!"
                                    : "No read notifications yet."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => 
                        groupNotifications.length > 0 && (
                            <div key={groupKey}>
                                {/* Group Header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                        {groupLabels[groupKey]}
                                    </h3>
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-xs text-gray-400">{groupNotifications.length}</span>
                                </div>
                                
                                {/* Group Items */}
                                <div className="space-y-2">
                                    {groupNotifications.map((notification) => {
                                        const { icon, bg } = getNotificationIcon(notification.type);
                                        const isProcessing = processingId === notification.id;
                                        
                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => !isProcessing && handleNotificationClick(notification)}
                                                className={`group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer
                                                    ${!notification.isRead 
                                                        ? 'border-l-4 border-l-blue-500 border-gray-200 shadow-sm hover:shadow-md' 
                                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
                                                    ${isProcessing ? 'opacity-50' : ''}`}
                                            >
                                                <div className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        {/* Icon */}
                                                        <div className={`flex-shrink-0 h-10 w-10 rounded-xl ${bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                                                            {icon}
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <h4 className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                        {notification.title}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                                        {getRelativeTime(notification.createdAt)}
                                                                    </p>
                                                                </div>
                                                                {!notification.isRead && (
                                                                    <div className="flex-shrink-0">
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                                            New
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                                                                {notification.message}
                                                            </p>
                                                            
                                                            {/* Type Badge */}
                                                            <div className="mt-2">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${bg} ${getNotificationIcon(notification.type).color}`}>
                                                                    {notification.type === 'Report' && '📊 Report'}
                                                                    {notification.type === 'TaskAssignment' && '📋 Task Assignment'}
                                                                    {notification.type === 'TaskComplete' && '✅ Task Complete'}
                                                                    {notification.type === 'BoardUpdate' && '👥 Board Update'}
                                                                    {notification.type === 'BoardComplete' && '🎉 Board Complete'}
                                                                    {notification.type === 'Reminder' && '⏰ Reminder'}
                                                                    {notification.type === 'Overdue' && '⚠️ Overdue'}
                                                                    {!['Report', 'TaskAssignment', 'TaskComplete', 'BoardUpdate', 'BoardComplete', 'Reminder', 'Overdue'].includes(notification.type) && '📢 Notification'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Loading overlay */}
                                                {isProcessing && (
                                                    <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
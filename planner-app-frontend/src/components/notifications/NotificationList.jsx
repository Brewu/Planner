import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircleIcon, BellIcon } from '@heroicons/react/24/outline';

const NotificationList = () => {
    const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'TaskAssignment':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'BoardUpdate':
                return <BellIcon className="h-5 w-5 text-blue-500" />;
            default:
                return <BellIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    if (notifications.length === 0) {
        return (
            <div className="text-center py-12">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                    You're all caught up!
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                    <div className="space-x-2">
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Mark all as read
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={clearNotifications}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            Clear all
                        </button>
                    </div>
                </div>

                <ul className="divide-y divide-gray-200">
                    {notifications.map((notification) => (
                        <li
                            key={notification.id}
                            className={`px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''
                                }`}
                            onClick={() => markAsRead(notification.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {getNotificationIcon(notification.type)}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                    {!notification.isRead && (
                                        <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default NotificationList;
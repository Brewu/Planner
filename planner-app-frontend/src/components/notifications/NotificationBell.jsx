import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, BellSlashIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const {
        unreadCount,
        notifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        deleteNotification,
        handleNotificationClick,
        setShowDropdown
    } = useNotifications();
    const navigate = useNavigate();

    const handleViewAll = () => {
        setShowDropdown(false);
        navigate('/notifications');
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none">
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-xs text-white font-medium flex items-center justify-center transform -translate-y-1/2 translate-x-1/2">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-96 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-4 py-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.slice(0, 5).map((notification) => (
                                <Menu.Item key={notification.id}>
                                    {({ active }) => (
                                        <div className="relative group">
                                            <div
                                                onClick={() => {
                                                    handleNotificationClick(notification);
                                                }}
                                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {!notification.isRead && (
                                                            <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Menu.Item>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <BellSlashIcon className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">No notifications</p>
                            </div>
                        )}
                    </div>

                    {notifications.length > 5 && (
                        <div className="px-4 py-2 text-center border-t border-gray-100">
                            <button
                                onClick={handleViewAll}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View all ({notifications.length}) notifications
                            </button>
                        </div>
                    )}

                    {notifications.length > 0 && (
                        <div className="px-4 py-2 text-center border-t border-gray-100">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearNotifications();
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </Menu.Items>
            </Transition>
        </Menu>
    );
};

export default NotificationBell;
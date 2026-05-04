import React from 'react';
import { DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ReportNotification = ({ notification, onView, onDismiss }) => {
    return (
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-xl">📊</span>
                        </div>
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            {notification.message}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-3 flex space-x-2">
                            <button
                                onClick={onView}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                                View Report
                            </button>
                            <button
                                onClick={onDismiss}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={onDismiss}
                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportNotification;
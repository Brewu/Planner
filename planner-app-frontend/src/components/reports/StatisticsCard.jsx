import React from 'react';
import {
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const StatisticsCard = ({ statistics, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!statistics) {
        return null;
    }

    const stats = [
        {
            label: 'Total Tasks',
            value: statistics.totalTasks,
            icon: DocumentTextIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            label: 'Completed',
            value: statistics.completed,
            icon: CheckCircleIcon,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            label: 'In Progress',
            value: statistics.inProgress,
            icon: ClockIcon,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            label: 'Pending',
            value: statistics.pending,
            icon: DocumentTextIcon,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
        },
        {
            label: 'Overdue',
            value: statistics.overdueTasks,
            icon: ExclamationCircleIcon,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            label: 'Due This Week',
            value: statistics.tasksDueThisWeek,
            icon: ChartBarIcon,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
    ];

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Board Statistics</h3>
                <div className="text-sm text-gray-500">
                    Completion: {statistics.completionPercentage}%
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${statistics.completionPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center space-x-3">
                        <div className={`${stat.bgColor} p-2 rounded-lg`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                            <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatisticsCard;
import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

const TaskFilters = ({ filters, onFilterChange, boardUsers }) => {
    return (
        <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center">
                <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">Filters:</span>
            </div>

            <select
                value={filters.status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">All Status</option>
                <option value="pending">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
            </select>

            <select
                value={filters.assignee}
                onChange={(e) => onFilterChange({ ...filters, assignee: e.target.value })}
                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">All Assignees</option>
                {boardUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                ))}
            </select>

            <select
                value={filters.dueDate}
                onChange={(e) => onFilterChange({ ...filters, dueDate: e.target.value })}
                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
            </select>
        </div>
    );
};

export default TaskFilters;
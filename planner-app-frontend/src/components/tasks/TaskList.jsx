import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const TaskList = ({ tasks, onTaskUpdate, isSupervisor, boardUsers }) => {
    const [expandedGroups, setExpandedGroups] = useState({
        pending: true,
        'in-progress': true,
        completed: true
    });

    const groupedTasks = {
        pending: tasks.filter(t => t.status === 'pending'),
        'in-progress': tasks.filter(t => t.status === 'in-progress'),
        completed: tasks.filter(t => t.status === 'completed')
    };

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const getGroupTitle = (group) => {
        switch (group) {
            case 'pending': return '📝 To Do';
            case 'in-progress': return '⚡ In Progress';
            case 'completed': return '✅ Completed';
            default: return group;
        }
    };

    const getGroupColor = (group) => {
        switch (group) {
            case 'pending': return 'bg-gray-50';
            case 'in-progress': return 'bg-blue-50';
            case 'completed': return 'bg-green-50';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="space-y-4">
            {Object.entries(groupedTasks).map(([group, groupTasks]) => (
                <div key={group} className={`${getGroupColor(group)} rounded-lg overflow-hidden`}>
                    {/* Group Header */}
                    <button
                        onClick={() => toggleGroup(group)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-75 transition-colors"
                    >
                        <div className="flex items-center space-x-2">
                            {expandedGroups[group] ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                            )}
                            <h3 className="font-medium text-gray-900">
                                {getGroupTitle(group)}
                            </h3>
                            <span className="ml-2 px-2 py-1 bg-white bg-opacity-50 rounded-full text-xs text-gray-600">
                                {groupTasks.length}
                            </span>
                        </div>
                    </button>

                    {/* Group Tasks */}
                    {expandedGroups[group] && (
                        <div className="p-4 space-y-3">
                            {groupTasks.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No tasks in this group
                                </p>
                            ) : (
                                groupTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onTaskUpdate={onTaskUpdate}
                                        isSupervisor={isSupervisor}
                                        boardUsers={boardUsers}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TaskList;
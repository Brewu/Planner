import React, { useState } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import TaskDetailModal from './TaskDetailModal';
import {
    UserCircleIcon,
    CalendarIcon,
    ClockIcon,
    TrashIcon,
    ArrowPathIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const TaskCard = ({ task, onTaskUpdate, isSupervisor, boardUsers, isDragging = false }) => {
    const { deleteTask } = useTasks();
    const [showDetail, setShowDetail] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const assignedUser = boardUsers?.find(u => u.id === task.assignedUserId) ?? task.assignedUser;

    const getStatusColor = () => {
        switch (task.status?.toLowerCase()) {
            case 'completed':   return 'border-green-500 bg-green-50';
            case 'in-progress': return 'border-blue-500 bg-blue-50';
            default:            return 'border-gray-200 bg-white';
        }
    };

    const getDueDateColor = () => {
        if (!task.dueDate) return 'text-gray-400';
        const days = Math.ceil((new Date(task.dueDate) - new Date()) / 86400000);
        if (days < 0)  return 'text-red-600 font-semibold';
        if (days === 0) return 'text-orange-600';
        if (days <= 3)  return 'text-yellow-600';
        return 'text-green-600';
    };

    const formatDueDate = (d) => {
        if (!d) return null;
        try { return format(new Date(d), 'MMM d, yyyy'); }
        catch { return null; }
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.isCompleted;

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm('Delete this task?')) {
            await deleteTask(task.id);
            onTaskUpdate?.();
        }
    };

    return (
        <>
            <div
                className={`relative group border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
                    ${getStatusColor()} ${isDragging ? 'shadow-xl rotate-1' : ''}`}
                onClick={() => !isDragging && setShowDetail(true)}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
            >
                <div className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex-1 pr-2">{task.title}</h4>

                        {/* Delete button on hover — supervisor only */}
                        {isSupervisor && showActions && !isDragging && (
                            <button
                                onClick={handleDelete}
                                className="p-1 text-gray-400 hover:text-red-600 rounded flex-shrink-0"
                                title="Delete task"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Description preview */}
                    {task.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    {/* Meta */}
                    <div className="space-y-1.5">
                        {assignedUser && (
                            <div className="flex items-center text-xs">
                                <UserCircleIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="text-gray-600 truncate">{assignedUser.name}</span>
                                {task.isAssignedToMe && (
                                    <span className="ml-1.5 text-green-600">(You)</span>
                                )}
                            </div>
                        )}

                        {task.dueDate && (
                            <div className={`flex items-center text-xs ${getDueDateColor()}`}>
                                <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span>Due {formatDueDate(task.dueDate)}</span>
                                {isOverdue && <span className="ml-1.5 font-medium">· Overdue!</span>}
                            </div>
                        )}

                        {task.reminderFrequency && (
                            <div className="flex items-center text-xs text-gray-400">
                                <ClockIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="capitalize">{task.reminderFrequency} reminders</span>
                            </div>
                        )}
                    </div>

                    {/* Status badge — hide while dragging */}
                    {!isDragging && (
                        <div className="mt-3 flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                ${task.status === 'completed'    ? 'bg-green-100 text-green-800' : ''}
                                ${task.status === 'in-progress'  ? 'bg-blue-100  text-blue-800'  : ''}
                                ${task.status === 'pending'      ? 'bg-gray-100  text-gray-800'  : ''}
                            `}>
                                {task.status === 'pending'     && '📝 To Do'}
                                {task.status === 'in-progress' && '⚡ In Progress'}
                                {task.status === 'completed'   && '✅ Completed'}
                            </span>

                            {/* Hint to open detail */}
                            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to {isSupervisor ? 'edit' : 'view'} →
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail / Edit Modal */}
            {showDetail && (
                <TaskDetailModal
                    task={task}
                    isSupervisor={isSupervisor}
                    boardUsers={boardUsers}
                    onClose={() => setShowDetail(false)}
                    onTaskUpdated={() => {
                        setShowDetail(false);
                        onTaskUpdate?.();
                    }}
                />
            )}
        </>
    );
};

export default TaskCard;
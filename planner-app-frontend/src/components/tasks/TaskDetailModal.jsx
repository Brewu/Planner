import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import {
    XMarkIcon,
    PencilIcon,
    CheckCircleIcon,
    CalendarIcon,
    ClockIcon,
    UserCircleIcon,
    ArrowPathIcon,
    TrashIcon,
    TagIcon,
    DocumentTextIcon,
    FlagIcon,
    ExclamationTriangleIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isPast, isToday, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending: {
        label: '📝 To Do',
        bg: 'bg-gradient-to-r from-gray-100 to-gray-200',
        text: 'text-gray-800',
        icon: FlagIcon,
        color: 'gray'
    },
    'in-progress': {
        label: '⚡ In Progress',
        bg: 'bg-gradient-to-r from-blue-100 to-indigo-100',
        text: 'text-blue-800',
        icon: ArrowPathIcon,
        color: 'blue'
    },
    completed: {
        label: '✅ Completed',
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-800',
        icon: CheckCircleIcon,
        color: 'green'
    },
};

const REMINDER_OPTIONS = [
    { value: '', label: 'No reminders', icon: '🔕' },
    { value: 'weekly', label: 'Weekly', icon: '📅' },
    { value: 'monthly', label: 'Monthly', icon: '📆' },
    { value: 'yearly', label: 'Yearly', icon: '📅' }
];

const TaskDetailModal = ({ task, onClose, isSupervisor, boardUsers = [], onTaskUpdated }) => {
    const { updateTask, deleteTask } = useTasks();

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [localTask, setLocalTask] = useState(task);

    // Update local task when prop changes
    useEffect(() => {
        setLocalTask(task);
    }, [task]);

    const [form, setForm] = useState({
        title: task.title ?? '',
        description: task.description ?? '',
        assignedUserId: task.assignedUserId ?? '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        reminderFrequency: task.reminderFrequency ?? '',
        status: task.status ?? 'pending',
    });

    const assignedUser = useMemo(() => {
        return boardUsers.find(u => u.id === task.assignedUserId) ?? task.assignedUser;
    }, [boardUsers, task.assignedUserId, task.assignedUser]);

    const getDueDateInfo = useMemo(() => {
        if (!task.dueDate) return null;

        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const daysUntil = differenceInDays(dueDate, today);
        const isOverdueFlag = isPast(dueDate) && !task.isCompleted;
        const isTodayFlag = isToday(dueDate);

        let color = 'text-gray-600';
        let badge = null;
        let icon = CalendarIcon;

        if (isOverdueFlag) {
            color = 'text-red-600';
            badge = { text: 'Overdue', color: 'bg-red-100 text-red-700' };
            icon = ExclamationTriangleIcon;
        } else if (isTodayFlag) {
            color = 'text-orange-600';
            badge = { text: 'Due today', color: 'bg-orange-100 text-orange-700' };
        } else if (daysUntil <= 3 && daysUntil > 0) {
            color = 'text-yellow-600';
            badge = { text: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, color: 'bg-yellow-100 text-yellow-700' };
        } else if (daysUntil > 0) {
            color = 'text-green-600';
        }

        return {
            color,
            badge,
            icon,
            formattedDate: format(dueDate, 'MMM d, yyyy'),
            daysUntil,
            isOverdue: isOverdueFlag
        };
    }, [task.dueDate, task.isCompleted]);

    const isOverdue = getDueDateInfo?.isOverdue || false;

    /* ── helpers ─────────────────────────────────────────── */
    const setField = (key) => (e) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    const formatDate = (d) => {
        if (!d) return '—';
        try { return format(new Date(d), 'MMM d, yyyy'); }
        catch { return '—'; }
    };

    /* ── actions ─────────────────────────────────────────── */
    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateTask(task.id, {
                ...form,
                isCompleted: form.status === 'completed',
                dueDate: form.dueDate || null,
                reminderFrequency: form.reminderFrequency || null,
            });

            if (result?.success) {
                toast.success('Task updated successfully!');
                setIsEditing(false);
                onTaskUpdated?.();
            } else {
                toast.error('Failed to update task');
            }
        } catch (error) {
            toast.error('Failed to update task');
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleQuickStatus = async (newStatus) => {
        setSaving(true);
        try {
            const result = await updateTask(task.id, {
                status: newStatus,
                isCompleted: newStatus === 'completed',
            });

            if (result?.success) {
                const statusMessages = {
                    'in-progress': 'Task started! ⚡',
                    'completed': 'Task completed! 🎉'
                };
                toast.success(statusMessages[newStatus] || 'Status updated');
                onTaskUpdated?.();
                onClose();
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            toast.error('Failed to update status');
            console.error('Status update error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

        setDeleting(true);
        try {
            await deleteTask(task.id);
            toast.success('Task deleted successfully');
            onTaskUpdated?.();
            onClose();
        } catch (error) {
            toast.error('Failed to delete task');
            console.error('Delete error:', error);
        } finally {
            setDeleting(false);
        }
    };

    const currentStatusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
    const StatusIcon = currentStatusConfig.icon;

    /* ── shared field styles ── */
    const inputCls = `
        mt-1 block w-full rounded-lg border-gray-300 shadow-sm text-sm 
        focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20
        transition-all duration-200
    `;

    const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 py-8">
                {/* Backdrop with blur */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Panel */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100 opacity-100">

                    {/* Decorative gradient bar */}
                    <div className={`h-2 w-full bg-gradient-to-r 
                        ${task.status === 'completed' ? 'from-green-400 to-emerald-500' :
                            task.status === 'in-progress' ? 'from-blue-400 to-indigo-500' :
                                'from-gray-400 to-gray-500'}`}
                    />

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                                ${currentStatusConfig.bg} ${currentStatusConfig.text}`}>
                                <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                {currentStatusConfig.label}
                            </div>
                            {isOverdue && (
                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                    Overdue
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                            {/* Edit button — supervisor only */}
                            {isSupervisor && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Edit task"
                                >
                                    <PencilIcon className="h-4.5 w-4.5" />
                                </button>
                            )}
                            {isSupervisor && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    title="Delete task"
                                >
                                    {deleting ? (
                                        <div className="animate-spin h-4.5 w-4.5 border-2 border-red-600 border-t-transparent rounded-full" />
                                    ) : (
                                        <TrashIcon className="h-4.5 w-4.5" />
                                    )}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            >
                                <XMarkIcon className="h-4.5 w-4.5" />
                            </button>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                        {/* Completion celebration banner */}
                        {task.status === 'completed' && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex items-center">
                                <SparklesIcon className="h-5 w-5 text-green-500 mr-2" />
                                <p className="text-sm text-green-700 font-medium">
                                    Task completed! Great work! 🎉
                                </p>
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <p className={labelCls}>
                                <TagIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                Title
                            </p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={setField('title')}
                                    className={inputCls}
                                    placeholder="Enter task title"
                                    required
                                    autoFocus
                                />
                            ) : (
                                <p className={`text-base font-semibold ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {task.title}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <p className={labelCls}>
                                <DocumentTextIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                Description
                            </p>
                            {isEditing ? (
                                <textarea
                                    value={form.description}
                                    onChange={setField('description')}
                                    rows={4}
                                    className={inputCls}
                                    placeholder="Add a detailed description of the task..."
                                />
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {task.description || <span className="italic text-gray-400">No description provided</span>}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 2-col grid for the smaller fields */}
                        <div className="grid grid-cols-2 gap-5">
                            {/* Assigned To */}
                            <div>
                                <p className={labelCls}>
                                    <UserCircleIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                    Assigned To
                                </p>
                                {isEditing ? (
                                    <select
                                        value={form.assignedUserId}
                                        onChange={setField('assignedUserId')}
                                        className={inputCls}
                                    >
                                        <option value="">Select a user...</option>
                                        {boardUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} {u.id === task.assignedUserId && '(Current)'}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                                            <span className="text-xs font-semibold text-white">
                                                {assignedUser?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-800">
                                                {assignedUser?.name ?? 'Unassigned'}
                                            </span>
                                            {task.isAssignedToMe && (
                                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <p className={labelCls}>
                                    <TagIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                    Status
                                </p>
                                {isEditing ? (
                                    <select
                                        value={form.status}
                                        onChange={setField('status')}
                                        className={inputCls}
                                    >
                                        <option value="pending">📝 To Do</option>
                                        <option value="in-progress">⚡ In Progress</option>
                                        <option value="completed">✅ Completed</option>
                                    </select>
                                ) : (
                                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold
                                        ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.text}`}>
                                        <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                        {currentStatusConfig.label}
                                    </div>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <p className={labelCls}>
                                    <CalendarIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                    Due Date
                                </p>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={form.dueDate}
                                        onChange={setField('dueDate')}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={inputCls}
                                    />
                                ) : task.dueDate ? (
                                    <div className={`mt-1 p-2 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                                        <div className={`flex items-center text-sm font-medium ${getDueDateInfo?.color || 'text-gray-700'}`}>
                                            <CalendarIcon className="h-4 w-4 mr-1.5" />
                                            {formatDate(task.dueDate)}
                                            {getDueDateInfo?.badge && (
                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getDueDateInfo.badge.color}`}>
                                                    {getDueDateInfo.badge.text}
                                                </span>
                                            )}
                                        </div>
                                        {!task.isCompleted && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-500 italic">No due date set</p>
                                )}
                            </div>

                            {/* Reminder Frequency */}
                            <div>
                                <p className={labelCls}>
                                    <ClockIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                    Reminder
                                </p>
                                {isEditing ? (
                                    <select
                                        value={form.reminderFrequency}
                                        onChange={setField('reminderFrequency')}
                                        className={inputCls}
                                    >
                                        {REMINDER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.icon} {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="mt-1">
                                        {task.reminderFrequency ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                                                <ClockIcon className="h-3 w-3 mr-1" />
                                                {task.reminderFrequency} reminders
                                            </span>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No reminders set</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Created At — read-only always */}
                        {task.createdAt && (
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        {/* Quick status actions — supervisee only, task not completed */}
                        {!isSupervisor && !isEditing && task.status !== 'completed' && (
                            <div className="flex space-x-2">
                                {task.status !== 'in-progress' && (
                                    <button
                                        onClick={() => handleQuickStatus('in-progress')}
                                        disabled={saving}
                                        className="inline-flex items-center px-3 py-2 rounded-lg border border-blue-300 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 transition-all duration-200"
                                    >
                                        <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5" />
                                        Start Progress
                                    </button>
                                )}
                                <button
                                    onClick={() => handleQuickStatus('completed')}
                                    disabled={saving}
                                    className="inline-flex items-center px-3 py-2 rounded-lg border border-green-300 text-xs font-medium text-green-700 bg-white hover:bg-green-50 disabled:opacity-50 transition-all duration-200"
                                >
                                    <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                                    Mark Complete
                                </button>
                            </div>
                        )}

                        {/* Spacer when there are no left-side buttons */}
                        {(isSupervisor || isEditing || task.status === 'completed') && (
                            <div />
                        )}

                        {/* Right-side buttons */}
                        <div className="flex space-x-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-sm"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 mr-1.5 border-2 border-white border-t-transparent rounded-full" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
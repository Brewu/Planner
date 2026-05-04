import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
    XMarkIcon, 
    CalendarIcon, 
    BellIcon, 
    UserCircleIcon,
    DocumentTextIcon,
    TagIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CreateTaskModal = ({ boardId, boardUsers, supervisorId, isBoardMember, onClose, onTaskCreated }) => {
    const { createTask } = useTasks();
    const { user: currentUser } = useAuth();

    const isSupervisor = currentUser?.id === supervisorId;
    const canCreateTasks = isSupervisor || isBoardMember;

    // Ensure current user is always in the assignee list for supervisors
    const enhancedBoardUsers = useMemo(() => {
        if (!boardUsers) return [];
        
        const currentUserInList = boardUsers.some(u => u.id === currentUser?.id);
        
        if (!currentUserInList && currentUser) {
            return [
                ...boardUsers,
                {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    staffId: currentUser.staffId,
                    position: currentUser.position,
                    isCurrentUser: true
                }
            ];
        }
        
        return boardUsers.map(u => ({
            ...u,
            isCurrentUser: u.id === currentUser?.id
        }));
    }, [boardUsers, currentUser]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedUserId: isSupervisor ? (currentUser?.id || '') : currentUser?.id,
        dueDate: '',
        reminderFrequency: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const frequencyOptions = [
        { value: '', label: 'No reminders', icon: '🔕', color: 'gray' },
        { value: 'weekly', label: 'Weekly', icon: '📅', color: 'purple' },
        { value: 'monthly', label: 'Monthly', icon: '📆', color: 'blue' },
        { value: 'yearly', label: 'Yearly', icon: '📅', color: 'green' }
    ];

    // If user doesn't have permission, show error and close
    useEffect(() => {
        if (!canCreateTasks) {
            toast.error("You don't have permission to create tasks in this board");
            onClose();
        }
    }, [canCreateTasks, onClose]);

    // For non-supervisors, automatically set assigned user to current user
    useEffect(() => {
        if (!isSupervisor && currentUser?.id) {
            setFormData(prev => ({
                ...prev,
                assignedUserId: currentUser.id
            }));
        }
    }, [isSupervisor, currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Please enter a task title');
            return;
        }
        if (!formData.assignedUserId) {
            toast.error('Please select a user to assign this task to');
            return;
        }

        setIsSubmitting(true);

        const frequencyMap = { weekly: 0, monthly: 1, yearly: 2 };

        const taskData = {
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            boardId: boardId,
            assignedUserId: formData.assignedUserId,
            dueDate: formData.dueDate || null,
            reminderFrequency: formData.reminderFrequency
                ? frequencyMap[formData.reminderFrequency]
                : null
        };

        try {
            const result = await createTask(taskData);
            if (result.success) {
                toast.success('Task created successfully! 🎉');
                onTaskCreated(result.data);
                onClose();
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            toast.error(error.response?.data || 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFrequencyIcon = (value) => {
        const option = frequencyOptions.find(opt => opt.value === value);
        return option?.icon || '🔔';
    };

    if (!canCreateTasks) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop with blur effect */}
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                    
                    {/* Decorative header bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Add a new task to this board</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center">
                                    <TagIcon className="h-4 w-4 mr-1 text-gray-400" />
                                    Task Title
                                    <span className="text-red-500 ml-1">*</span>
                                </span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                onFocus={() => setFocusedField('title')}
                                onBlur={() => setFocusedField(null)}
                                className={`block w-full border-2 rounded-xl shadow-sm px-4 py-2.5 text-sm transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    ${focusedField === 'title' 
                                        ? 'border-blue-300 bg-blue-50' 
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                placeholder="e.g., Complete project documentation"
                                autoFocus
                            />
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center">
                                    <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-400" />
                                    Description
                                </span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                onFocus={() => setFocusedField('description')}
                                onBlur={() => setFocusedField(null)}
                                rows={3}
                                className={`block w-full border-2 rounded-xl shadow-sm px-4 py-2.5 text-sm transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    ${focusedField === 'description' 
                                        ? 'border-blue-300 bg-blue-50' 
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                placeholder="Add detailed description of the task..."
                            />
                        </div>

                        {/* Assignment section */}
                        {isSupervisor ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center">
                                        <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                                        Assign To
                                        <span className="text-red-500 ml-1">*</span>
                                    </span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.assignedUserId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, assignedUserId: e.target.value })
                                        }
                                        className="block w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-2.5 text-sm 
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            hover:border-gray-400 transition-all duration-200 appearance-none bg-white"
                                    >
                                        <option value="">Select a team member...</option>
                                        {enhancedBoardUsers.map((user) => (
                                            <option key={user.id} value={user.id} className="py-2">
                                                {user.name} 
                                                {user.email ? ` (${user.email})` : ''}
                                                {user.isCurrentUser && ' ✨ (You)'}
                                                {user.position && ` - ${user.position}`}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 flex items-center">
                                    <UserCircleIcon className="h-3 w-3 mr-1" />
                                    You can assign tasks to any board member including yourself
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center">
                                        <UserCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
                                        Assigned To
                                    </span>
                                </label>
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                                            <span className="text-base font-bold text-white">
                                                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {currentUser?.name}
                                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                    You
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-600 mt-0.5">{currentUser?.email}</p>
                                            {currentUser?.staffId && (
                                                <p className="text-xs text-gray-500 mt-0.5">Staff ID: {currentUser.staffId}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 flex items-center">
                                    <BellIcon className="h-3 w-3 mr-1" />
                                    Tasks are automatically assigned to you. The supervisor will be notified.
                                </p>
                            </div>
                        )}

                        {/* Due Date Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                                    Due Date
                                </span>
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="block w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-2.5 text-sm 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    hover:border-gray-400 transition-all duration-200"
                            />
                        </div>

                        {/* Reminder Frequency Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <span className="flex items-center">
                                    <BellIcon className="h-4 w-4 mr-1 text-gray-400" />
                                    Reminder Frequency
                                </span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {frequencyOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, reminderFrequency: option.value })}
                                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                            ${formData.reminderFrequency === option.value
                                                ? `bg-${option.color}-500 text-white shadow-md transform scale-[1.02]`
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span className="mr-2">{option.icon}</span>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 
                                    rounded-xl transition-all duration-200 hover:shadow-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="relative px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 
                                    hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 
                                    disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg
                                    flex items-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Create Task</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
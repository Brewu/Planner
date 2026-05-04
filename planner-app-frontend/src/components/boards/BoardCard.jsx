import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBoards } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
    CalendarIcon, 
    UserGroupIcon, 
    CheckCircleIcon,
    PencilIcon,
    TrashIcon,
    UserPlusIcon,
    XMarkIcon,
    ChevronDownIcon,
    UserCircleIcon,
    SparklesIcon,
    ExclamationTriangleIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';
// Map enum values to display strings and colors
const FREQUENCY_MAP = {
    0: { label: 'Weekly', color: 'bg-purple-100 text-purple-800', icon: '📅' },
    1: { label: 'Monthly', color: 'bg-blue-100 text-blue-800', icon: '📆' },
    2: { label: 'Yearly', color: 'bg-green-100 text-green-800', icon: '📅' },
    'weekly': { label: 'Weekly', color: 'bg-purple-100 text-purple-800', icon: '📅' },
    'monthly': { label: 'Monthly', color: 'bg-blue-100 text-blue-800', icon: '📆' },
    'yearly': { label: 'Yearly', color: 'bg-green-100 text-green-800', icon: '📅' },
};

const BoardCard = ({ board, onEdit, onDelete, onReassign }) => {
    const { user } = useAuth();
    const { deleteBoard, reassignBoard, fetchBoards } = useBoards();
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isSupervisor = board.supervisorId === user?.id;
    const isAssigned = board.assignedUsers?.some(u => u.id === user?.id) || false;

    // Fetch available users when modal opens
    useEffect(() => {
        if (showReassignModal && availableUsers.length === 0) {
            fetchAvailableUsers();
        }
    }, [showReassignModal]);

    const fetchAvailableUsers = async () => {
        try {
            // Fetch all users from your API
            const response = await api.get('/Users');
            const allUsers = response.data || [];
            
            // Filter out users already assigned to the board
            const assignedIds = new Set(board.assignedUsers?.map(u => u.id) || []);
            const unassignedUsers = allUsers.filter(u => !assignedIds.has(u.id));
            
            setAvailableUsers(unassignedUsers);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Failed to load users');
        }
    };

    // Safely get frequency display info
    const getFrequencyInfo = () => {
        if (typeof board.frequency === 'number') {
            return FREQUENCY_MAP[board.frequency] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '📋' };
        }
        if (typeof board.frequency === 'string') {
            const key = board.frequency.toLowerCase();
            return FREQUENCY_MAP[key] || { label: board.frequency, color: 'bg-gray-100 text-gray-800', icon: '📋' };
        }
        return { label: 'Not set', color: 'bg-gray-100 text-gray-800', icon: '📋' };
    };

    const frequencyInfo = getFrequencyInfo();

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setIsDeleting(true);
        try {
            const result = await deleteBoard(board.id);
            if (result.success) {
                toast.success(`Board "${board.name}" deleted successfully`);
                // Refresh boards list
                await fetchBoards(true);
                onDelete?.(board.id);
            } else {
                toast.error(result.message || 'Failed to delete board');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete board');
            console.error('Delete error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleUser = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleReassign = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Please select at least one user to assign');
            return;
        }

        setIsReassigning(true);
        try {
            const result = await reassignBoard(board.id, selectedUsers);
            if (result.success) {
                toast.success(`${selectedUsers.length} user(s) assigned to board`);
                setShowReassignModal(false);
                setSelectedUsers([]);
                setSearchTerm('');
                // Refresh board data
                await fetchBoards(true);
                onReassign?.(board.id, selectedUsers);
            } else {
                toast.error(result.message || 'Failed to assign users');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign users');
            console.error('Reassign error:', error);
        } finally {
            setIsReassigning(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return availableUsers;
        const term = searchTerm.toLowerCase();
        return availableUsers.filter(u => 
            u.name?.toLowerCase().includes(term) || 
            u.email?.toLowerCase().includes(term) ||
            u.staffId?.toLowerCase().includes(term)
        );
    }, [availableUsers, searchTerm]);

    const assignedUsersList = board.assignedUsers || [];

    return (
        <>
            <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-200 hover:-translate-y-1">
                {/* Header with gradient bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r 
                    ${board.isCompleted ? 'from-green-400 to-emerald-500' : 
                      isSupervisor ? 'from-blue-400 to-indigo-500' : 
                      'from-gray-400 to-gray-500'}`} 
                />
                
                <div className="p-5">
                    {/* Header with title and actions */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <Link to={`/boards/${board.id}/tasks`} className="block group">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                                    {board.name}
                                </h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${frequencyInfo.color}`}>
                                    <span>{frequencyInfo.icon}</span>
                                    {frequencyInfo.label}
                                </span>
                                {board.isCompleted && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                                        <CheckCircleIcon className="h-3 w-3" />
                                        Completed
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Actions - Only visible to supervisor */}
                        {isSupervisor && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={() => setShowReassignModal(true)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Assign users"
                                >
                                    <UserPlusIcon className="h-4.5 w-4.5" />
                                </button>
                                <button
                                    onClick={() => onEdit?.(board)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                    title="Edit board"
                                >
                                    <PencilIcon className="h-4.5 w-4.5" />
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isDeleting}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    title="Delete board"
                                >
                                    {isDeleting ? (
                                        <div className="animate-spin h-4.5 w-4.5 border-2 border-red-600 border-t-transparent rounded-full" />
                                    ) : (
                                        <TrashIcon className="h-4.5 w-4.5" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Supervisor info */}
                    {board.supervisor && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Supervisor</p>
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                                    <span className="text-sm font-bold text-white">
                                        {getInitials(board.supervisor.name)}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-semibold text-gray-900">{board.supervisor.name}</p>
                                    <p className="text-xs text-gray-500">{board.supervisor.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assigned Users */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <UserGroupIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                Assigned Users
                            </p>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {assignedUsersList.length} {assignedUsersList.length === 1 ? 'user' : 'users'}
                            </span>
                        </div>
                        
                        {assignedUsersList.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-xl">
                                <UserCircleIcon className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                                <p className="text-xs text-gray-400">No users assigned yet</p>
                                {isSupervisor && (
                                    <button
                                        onClick={() => setShowReassignModal(true)}
                                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        + Add users
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {assignedUsersList.slice(0, 6).map((assignedUser) => (
                                    <div
                                        key={assignedUser.id}
                                        className="group relative"
                                        title={`${assignedUser.name} (${assignedUser.email})`}
                                    >
                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-200
                                            ${assignedUser.id === user?.id 
                                                ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white ring-2 ring-green-300 ring-offset-1' 
                                                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 group-hover:scale-110'}`}>
                                            {getInitials(assignedUser.name)}
                                        </div>
                                        {assignedUser.id === user?.id && (
                                            <div className="absolute -top-1 -right-1">
                                                <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {assignedUsersList.length > 6 && (
                                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shadow-sm">
                                        +{assignedUsersList.length - 6}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isSupervisor ? (
                                <>
                                    <SparklesIcon className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium text-blue-600">You are the supervisor</span>
                                </>
                            ) : isAssigned ? (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-600">You are assigned</span>
                                </>
                            ) : (
                                <>
                                    <EyeIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">Observer</span>
                                </>
                            )}
                        </div>
                        <Link
                            to={`/boards/${board.id}/tasks`}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-1 group"
                        >
                            View Tasks
                            <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center px-4 py-8">
                        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-pink-500 rounded-t-2xl" />
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Delete Board?</h3>
                                        <p className="text-sm text-gray-500">This action cannot be undone</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-2">
                                    Are you sure you want to delete "<span className="font-semibold">{board.name}</span>"?
                                </p>
                                <p className="text-sm text-red-600 mb-6">
                                    Warning: This will permanently delete all tasks and data associated with this board.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <TrashIcon className="h-4 w-4" />
                                                Delete Board
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reassign Modal */}
            {showReassignModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center px-4 py-8">
                        {/* Backdrop with blur */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowReassignModal(false)}
                        />

                        {/* Modal Panel */}
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300">
                            {/* Decorative header bar */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Assign Users to Board</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{board.name}</p>
                                </div>
                                <button
                                    onClick={() => setShowReassignModal(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Current assigned users summary */}
                                {assignedUsersList.length > 0 && (
                                    <div className="bg-blue-50 rounded-xl p-3">
                                        <p className="text-xs font-semibold text-blue-700 mb-2">Currently Assigned ({assignedUsersList.length})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {assignedUsersList.slice(0, 5).map(u => (
                                                <span key={u.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-blue-100 text-blue-700">
                                                    {u.name}
                                                </span>
                                            ))}
                                            {assignedUsersList.length > 5 && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-blue-100 text-blue-700">
                                                    +{assignedUsersList.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Search input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Add Users to Board
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onFocus={() => setShowDropdown(true)}
                                            placeholder="Search by name, email, or staff ID..."
                                            className="block w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-2.5 text-sm 
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                                transition-all duration-200"
                                        />
                                        <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>

                                {/* User selection list */}
                                <div className="max-h-64 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-1">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-center py-8">
                                            <UserCircleIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400">
                                                {searchTerm ? 'No users found' : 'No available users to assign'}
                                            </p>
                                            {searchTerm && (
                                                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                            )}
                                        </div>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => handleToggleUser(u.id)}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-between
                                                    ${selectedUsers.includes(u.id) 
                                                        ? 'bg-blue-50 border-2 border-blue-300' 
                                                        : 'hover:bg-gray-50 border-2 border-transparent'}`}
                                            >
                                                <div className="flex items-center min-w-0">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold
                                                        ${selectedUsers.includes(u.id) 
                                                            ? 'bg-blue-500 text-white' 
                                                            : 'bg-gray-100 text-gray-600'}`}>
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <div className="ml-3 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>{u.email}</span>
                                                            {u.staffId && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{u.staffId}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedUsers.includes(u.id) && (
                                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>

                                {/* Selected count */}
                                {selectedUsers.length > 0 && (
                                    <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                                        <span className="text-gray-600">
                                            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                                        </span>
                                        <button
                                            onClick={() => setSelectedUsers([])}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => setShowReassignModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReassign}
                                    disabled={selectedUsers.length === 0 || isReassigning}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-sm"
                                >
                                    {isReassigning ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 mr-1.5 border-2 border-white border-t-transparent rounded-full" />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlusIcon className="h-4 w-4 mr-1.5" />
                                            Assign {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BoardCard;
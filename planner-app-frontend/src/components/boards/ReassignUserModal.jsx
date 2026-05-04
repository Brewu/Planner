import React, { useState, useEffect } from 'react';
import { useBoards } from '../../contexts/BoardContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ReassignUsersModal = ({ board, onClose, onReassigned }) => {
    const { reassignUsers } = useBoards();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Initialize with current assigned users
    useEffect(() => {
        if (board.assignedUsers) {
            setSelectedUsers(board.assignedUsers);
        }
    }, [board]);

    // Search users
    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await api.get(`/Supervisors/search?name=${encodeURIComponent(searchTerm)}`);
                // Filter out already selected users
                const filtered = response.data.filter(u =>
                    !selectedUsers.some(selected => selected.id === u.id)
                );
                setSearchResults(filtered);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, selectedUsers]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const userIds = selectedUsers.map(u => u.id);
        const result = await reassignUsers(board.id, userIds);
        setLoading(false);

        if (result.success) {
            onReassigned();
            onClose();
        }
    };

    const addUser = (user) => {
        setSelectedUsers([...selectedUsers, user]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            onClick={onClose}
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Manage Users - {board.name}
                            </h3>

                            {/* User Search */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Add Users
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search users to add..."
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => addUser(user)}
                                            className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                        >
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            {user.email && (
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Selected Users */}
                            {selectedUsers.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assigned Users ({selectedUsers.length})
                                    </label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {selectedUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    {user.email && (
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeUser(user.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                            >
                                {loading ? <LoadingSpinner /> : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReassignUsersModal;
import React, { useState, useEffect } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { useBoards } from '../../contexts/BoardContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ReassignTaskModal = ({ task, onClose, onReassigned }) => {
    const { reassignTask } = useTasks();
    const { boards } = useBoards();
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(task.assignedUserId);

    const currentBoard = boards.find(b => b.id === task.boardId);
    const availableUsers = currentBoard?.assignedUsers || [];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedUserId === task.assignedUserId) {
            onClose();
            return;
        }

        setLoading(true);
        const result = await reassignTask(task.id, selectedUserId);
        setLoading(false);

        if (result.success) {
            onReassigned();
            onClose();
        }
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
                                Reassign Task
                            </h3>

                            <p className="text-sm text-gray-500 mb-4">
                                Reassign "{task.title}" to another user
                            </p>

                            {/* Current Assignee */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">Current Assignee</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {task.assignedUser?.name}
                                </p>
                            </div>

                            {/* New Assignee */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reassign To *
                                </label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    required
                                >
                                    <option value="">Select a user</option>
                                    {availableUsers.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} {user.id === task.assignedUserId ? '(Current)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {availableUsers.length === 0 && (
                                <p className="text-sm text-yellow-600 mb-4">
                                    No other users are assigned to this board.
                                </p>
                            )}
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                            <button
                                type="submit"
                                disabled={loading || availableUsers.length === 0}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                            >
                                {loading ? <LoadingSpinner /> : 'Reassign Task'}
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

export default ReassignTaskModal;
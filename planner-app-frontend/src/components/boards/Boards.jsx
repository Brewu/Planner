import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBoards } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import BoardCard from './BoardCard';
import CreateBoardModal from './CreateBoardModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

const Boards = () => {
    const { boards, loading, fetchBoards, createBoard, updateBoard } = useBoards();
    const { user } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [filter, setFilter] = useState('all'); // all, supervisor, assigned
    const [searchTerm, setSearchTerm] = useState('');

    // Track if we've loaded boards
    const loadedRef = useRef(false);
    const fetchInProgressRef = useRef(false);

    // Load boards only once
    useEffect(() => {
        const loadBoards = async () => {
            if (!loadedRef.current && !fetchInProgressRef.current) {
                fetchInProgressRef.current = true;
                await fetchBoards();
                loadedRef.current = true;
                fetchInProgressRef.current = false;
            }
        };

        loadBoards();
    }, [fetchBoards]);

    // Filter boards
    const filteredBoards = boards.filter(board => {
        // Apply role filter
        if (filter === 'supervisor' && board.supervisorId !== user?.id) {
            return false;
        }
        if (filter === 'assigned' && !board.assignedUsers?.some(u => u.id === user?.id)) {
            return false;
        }

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                board.name.toLowerCase().includes(term) ||
                board.supervisor?.name?.toLowerCase().includes(term) ||
                board.assignedUsers?.some(u => u.name.toLowerCase().includes(term))
            );
        }

        return true;
    });

    const handleCreateBoard = async (boardData) => {
        const result = await createBoard(boardData);
        if (result.success) {
            setShowCreateModal(false);
        }
    };

    const handleUpdateBoard = async (boardId, updates) => {
        const result = await updateBoard(boardId, updates);
        if (result.success) {
            setEditingBoard(null);
        }
    };

    if (loading && !loadedRef.current) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900">My Boards</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        New Board
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="all">All Boards</option>
                            <option value="supervisor">I'm Supervisor</option>
                            <option value="assigned">I'm Assigned</option>
                        </select>
                    </div>

                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search boards by name or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Boards Grid */}
            {filteredBoards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No boards found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {boards.length === 0
                            ? "Get started by creating a new board."
                            : "Try adjusting your filters."}
                    </p>
                    {boards.length === 0 && (
                        <div className="mt-6">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                Create Board
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBoards.map((board) => (
                        <BoardCard
                            key={board.id}
                            board={board}
                            onEdit={() => setEditingBoard(board)}
                            onDelete={(boardId) => {
                                // Handle delete if needed
                            }}
                            onReassign={(boardId, userIds) => {
                                // Handle reassign if needed
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Create Board Modal */}
            {/* Create Board Modal */}
            {showCreateModal && (
                <CreateBoardModal
                    onClose={() => setShowCreateModal(false)}
                    onBoardCreated={(newBoard) => {
                        setShowCreateModal(false);
                        // Optionally refresh boards or add to list
                        fetchBoards(true); // Force refresh
                    }}
                />
            )}

            {/* Edit Board Modal */}
            {editingBoard && (
                <CreateBoardModal
                    board={editingBoard}
                    onClose={() => setEditingBoard(null)}
                    onBoardUpdated={(updatedBoard) => {
                        setEditingBoard(null);
                        fetchBoards(true);
                    }}
                />
            )}

            {/* Edit Board Modal */}
            {editingBoard && (
                <CreateBoardModal
                    board={editingBoard}
                    onClose={() => setEditingBoard(null)}
                    onUpdate={handleUpdateBoard}
                />
            )}
        </div>
    );
};

export default Boards;
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTasks } from '../../contexts/TaskContext';
import { useBoards } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContext';
import TaskBoard from './TaskBoard';
import TaskList from './TaskList';
import CreateTaskModal from './CreateTaskModal';
import TaskFilters from './TaskFilters';
import StatisticsCard from '../reports/StatisticsCard';
import ReportActions from '../reports/ReportActions';
import LoadingSpinner from '../common/LoadingSpinner';
import { PlusIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const Tasks = () => {
    const { boardId } = useParams();
    const { boards } = useBoards();
    const { tasks, loading, fetchTasksByBoard } = useTasks();
    const { statistics, fetchStatistics } = useReports();
    const { user } = useAuth(); // This gives you currentUser as 'user'
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewMode, setViewMode] = useState('kanban');
    const [filters, setFilters] = useState({
        status: 'all',
        assignee: 'all',
        dueDate: 'all'
    });
    const [allSupervisors, setAllSupervisors] = useState([]);

    // Track if we've loaded tasks for this board
    const loadedBoardRef = useRef(null);
    const fetchInProgressRef = useRef(false);

    const currentBoard = boards.find(b => b.id === boardId);
    const isSupervisor = currentBoard?.supervisorId === user?.id;

    // Define isBoardMember using currentBoard and user
    const isBoardMember = currentBoard?.assignedUsers?.some(u => u.id === user?.id) || false;

    // Load tasks when board changes
    useEffect(() => {
        const loadTasks = async () => {
            if (!boardId || fetchInProgressRef.current || loadedBoardRef.current === boardId) return;

            fetchInProgressRef.current = true;
            loadedBoardRef.current = boardId;

            await fetchTasksByBoard(boardId);
            await fetchStatistics(boardId);

            // Fetch all supervisors for the current user
            if (user?.id) {
                try {
                    const res = await api.get(`/Supervisors/${user.id}/supervisors`);
                    setAllSupervisors(res.data || []);
                } catch (err) {
                    console.error('Failed to fetch supervisors:', err);
                }
            }

            fetchInProgressRef.current = false;
        };
        loadTasks();
    }, [boardId, fetchTasksByBoard, fetchStatistics, user]);

    const getRecipients = useCallback(() => {
        if (!currentBoard) return [];

        const seen = new Set();
        const recipients = [];

        // Board's own supervisor goes first — marked as primary
        if (currentBoard.supervisor) {
            seen.add(currentBoard.supervisor.id);
            recipients.push({
                id: currentBoard.supervisor.id,
                name: currentBoard.supervisor.name,
                email: currentBoard.supervisor.email,
                role: 'Board Supervisor',
                isPrimary: true,
            });
        }

        // All other supervisors of the current user
        allSupervisors.forEach(s => {
            if (!seen.has(s.id)) {
                seen.add(s.id);
                recipients.push({
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    role: 'Supervisor',
                    isPrimary: false,
                });
            }
        });

        return recipients;
    }, [currentBoard, allSupervisors]);

    // Apply filters
    const boardTasks = useMemo(() => {
        let filtered = [...tasks];

        if (filters.status === 'completed') {
            filtered = filtered.filter(t => t.isCompleted);
        } else if (filters.status === 'pending') {
            filtered = filtered.filter(t => !t.isCompleted);
        } else if (filters.status === 'in-progress') {
            filtered = filtered.filter(t => t.status === 'in-progress');
        }

        if (filters.assignee !== 'all') {
            filtered = filtered.filter(t => t.assignedUserId === filters.assignee);
        }

        if (filters.dueDate === 'overdue') {
            filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.isCompleted);
        } else if (filters.dueDate === 'today') {
            const today = new Date().toDateString();
            filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today);
        } else if (filters.dueDate === 'week') {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) <= nextWeek);
        }

        return filtered;
    }, [tasks, filters]);

    if (!boardId) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <h2 className="text-lg font-medium text-gray-900">Select a board to view tasks</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Choose a board from the Boards page to see its tasks.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {currentBoard?.name || 'Board'} Tasks
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {isSupervisor
                                ? 'You are the supervisor of this board'
                                : isBoardMember
                                    ? 'You are assigned to this board'
                                    : 'You are viewing this board'
                            }
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        {/* Report Actions */}
                        <ReportActions
                            boardId={boardId}
                            boardName={currentBoard?.name}
                            recipients={getRecipients()}
                            onReportGenerated={() => fetchStatistics(boardId)}
                            board={currentBoard}
                            tasks={tasks}
                            statistics={statistics}
                            currentUserName={user?.name}
                        />

                        {/* View Toggle */}
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium ${viewMode === 'kanban'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <Squares2X2Icon className="h-4 w-4 mr-2" />
                                Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`relative inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium ${viewMode === 'list'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <ListBulletIcon className="h-4 w-4 mr-2" />
                                List
                            </button>
                        </div>

                        {/* Any board member can create tasks */}
                        {(isSupervisor || isBoardMember) && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                New Task
                            </button>
                        )}
                    </div>
                </div>

                {/* Statistics Card */}
                <div className="mt-4">
                    <StatisticsCard statistics={statistics} loading={loading} />
                </div>

                <TaskFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    boardUsers={currentBoard?.assignedUsers || []}
                />
            </div>

            {/* Tasks View */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" />
                </div>
            ) : (
                <>
                    {viewMode === 'kanban' ? (
                        <TaskBoard
                            tasks={boardTasks}
                            onTaskUpdate={() => {
                                fetchTasksByBoard(boardId, true);
                                fetchStatistics(boardId);
                            }}
                            isSupervisor={isSupervisor}
                            boardUsers={currentBoard?.assignedUsers || []}
                        />
                    ) : (
                        <TaskList
                            tasks={boardTasks}
                            onTaskUpdate={() => {
                                fetchTasksByBoard(boardId, true);
                                fetchStatistics(boardId);
                            }}
                            isSupervisor={isSupervisor}
                            boardUsers={currentBoard?.assignedUsers || []}
                        />
                    )}
                </>
            )}

            {showCreateModal && (
                <CreateTaskModal
                    boardId={boardId}
                    boardUsers={currentBoard?.assignedUsers || []}
                    supervisorId={currentBoard?.supervisorId}
                    isBoardMember={isBoardMember}
                    onClose={() => setShowCreateModal(false)}
                    onTaskCreated={() => {
                        setShowCreateModal(false);
                        fetchTasksByBoard(boardId, true);
                        fetchStatistics(boardId);
                    }}
                />
            )}
        </div>
    );
};

export default Tasks;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBoards } from '../../contexts/BoardContext';
import { useTasks } from '../../contexts/TaskContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import {
    CalendarIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ViewColumnsIcon,
    BellIcon,
    ArrowTrendingUpIcon,
    FireIcon,
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';

const Dashboard = () => {
    const { user } = useAuth();
    const { boards } = useBoards();
    const { tasks, fetchTasksByBoard } = useTasks();
    const { notifications, unreadCount } = useNotifications();
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    // Colors for charts
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    useEffect(() => {
        const fetchAllTasks = async () => {
            setLoading(true);
            let allBoardTasks = [];
            for (const board of boards) {
                const boardTasks = await fetchTasksByBoard(board.id);
                allBoardTasks = [...allBoardTasks, ...boardTasks];
            }
            setAllTasks(allBoardTasks);
            setLoading(false);
        };

        if (boards.length > 0) {
            fetchAllTasks();
        }
    }, [boards, fetchTasksByBoard]);

    // Calculate statistics
    const totalBoards = boards?.length || 0;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks due soon
    const today = new Date();
    const tasksDueToday = allTasks.filter(t =>
        t.dueDate && isToday(new Date(t.dueDate)) && !t.isCompleted
    ).length;

    const tasksDueTomorrow = allTasks.filter(t =>
        t.dueDate && isTomorrow(new Date(t.dueDate)) && !t.isCompleted
    ).length;

    const overdueTasks = allTasks.filter(t =>
        t.dueDate && isPast(new Date(t.dueDate)) && !t.isCompleted
    ).length;

    // Tasks by board for pie chart
    const tasksByBoard = boards.map(board => ({
        name: board.name.length > 15 ? board.name.substring(0, 15) + '...' : board.name,
        value: allTasks.filter(t => t.boardId === board.id).length,
        fullName: board.name
    })).filter(b => b.value > 0);

    // Tasks by day for area chart (next 7 days)
    const next7Days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        return {
            date: format(date, 'EEE'),
            fullDate: date,
            tasks: allTasks.filter(t =>
                t.dueDate &&
                format(new Date(t.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
                !t.isCompleted
            ).length,
            completed: allTasks.filter(t =>
                t.dueDate &&
                format(new Date(t.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
                t.isCompleted
            ).length
        };
    });

    // Recent activities (mix of notifications and tasks)
    const recentActivities = [
        ...notifications.slice(0, 3).map(n => ({
            id: n.id,
            type: 'notification',
            title: n.title,
            description: n.message,
            time: new Date(n.createdAt),
            icon: BellIcon,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-100'
        })),
        ...allTasks.filter(t => t.createdAt).slice(0, 3).map(t => ({
            id: t.id,
            type: 'task',
            title: 'Task Created',
            description: t.title,
            time: new Date(t.createdAt),
            icon: DocumentTextIcon,
            iconColor: 'text-green-500',
            bgColor: 'bg-green-100'
        }))
    ].sort((a, b) => b.time - a.time).slice(0, 5);

    // Quick stats cards
    const statsCards = [
        {
            title: 'Total Boards',
            value: totalBoards,
            icon: ViewColumnsIcon,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            link: '/boards',
            linkText: 'View Boards'
        },
        {
            title: 'Total Tasks',
            value: totalTasks,
            icon: DocumentTextIcon,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            link: '/tasks',
            linkText: 'View Tasks'
        },
        {
            title: 'Completed',
            value: completedTasks,
            icon: CheckCircleIcon,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            link: '/tasks?status=completed',
            linkText: 'View Completed'
        },
        {
            title: 'Pending',
            value: pendingTasks,
            icon: ClockIcon,
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600',
            link: '/tasks?status=pending',
            linkText: 'View Pending'
        },
        {
            title: 'Completion Rate',
            value: `${completionRate}%`,
            icon: ChartBarIcon,
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600',
            link: '#',
            linkText: 'View Stats'
        },
        {
            title: 'Team Members',
            value: boards.reduce((acc, board) => acc + (board.assignedUsers?.length || 0), 0),
            icon: UserGroupIcon,
            color: 'from-pink-500 to-pink-600',
            bgColor: 'bg-pink-50',
            textColor: 'text-pink-600',
            link: '/team',
            linkText: 'View Team'
        }
    ];

    // Priority tasks
    const priorityTasks = allTasks
        .filter(t => !t.isCompleted && t.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{greeting}, {user?.name}! 👋</h1>
                            <p className="mt-2 text-blue-100">
                                Welcome back to your workspace. Here's what's happening with your projects today.
                            </p>
                        </div>

                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm">Tasks Due Today</p>
                                    <p className="text-2xl font-bold">{tasksDueToday}</p>
                                </div>
                                <CalendarIcon className="h-8 w-8 text-blue-200" />
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm">Due Tomorrow</p>
                                    <p className="text-2xl font-bold">{tasksDueTomorrow}</p>
                                </div>
                                <ClockIcon className="h-8 w-8 text-blue-200" />
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm">Overdue</p>
                                    <p className="text-2xl font-bold text-red-300">{overdueTasks}</p>
                                </div>
                                <FireIcon className="h-8 w-8 text-red-300" />
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-sm">Notifications</p>
                                    <p className="text-2xl font-bold">{unreadCount}</p>
                                </div>
                                <BellIcon className="h-8 w-8 text-blue-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    {statsCards.map((stat, index) => (
                        <Link
                            key={index}
                            to={stat.link}
                            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`${stat.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                                </div>
                            </div>
                            <p className="text-xs text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {stat.linkText} →
                            </p>
                        </Link>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Tasks by Board Pie Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Board</h2>
                        {tasksByBoard.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={tasksByBoard}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {tasksByBoard.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400">
                                No tasks to display
                            </div>
                        )}
                    </div>

                    {/* Upcoming Tasks Area Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tasks (Next 7 Days)</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={next7Days}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="tasks"
                                        stackId="1"
                                        stroke="#3B82F6"
                                        fill="#93C5FD"
                                        name="Pending Tasks"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="completed"
                                        stackId="2"
                                        stroke="#10B981"
                                        fill="#6EE7B7"
                                        name="Completed Tasks"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Priority Tasks and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Priority Tasks */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Priority Tasks</h2>
                            <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-800">
                                View all →
                            </Link>
                        </div>
                        {priorityTasks.length > 0 ? (
                            <div className="space-y-3">
                                {priorityTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        to={`/boards/${task.boardId}/tasks`}
                                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{task.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                    {task.description || 'No description'}
                                                </p>
                                                <div className="flex items-center mt-2 space-x-3">
                                                    <span className="text-xs text-gray-400">
                                                        Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                                                    </span>
                                                    {isPast(new Date(task.dueDate)) && !task.isCompleted && (
                                                        <span className="text-xs text-red-600 font-medium">Overdue</span>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowTrendingUpIcon className="h-5 w-5 text-orange-500 ml-2" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                No priority tasks
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                            <Link to="/notifications" className="text-sm text-blue-600 hover:text-blue-800">
                                View all →
                            </Link>
                        </div>
                        {recentActivities.length > 0 ? (
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {recentActivities.map((activity, index) => (
                                        <li key={activity.id}>
                                            <div className="relative pb-8">
                                                {index !== recentActivities.length - 1 && (
                                                    <span
                                                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className={`h-8 w-8 rounded-full ${activity.bgColor} flex items-center justify-center ring-8 ring-white`}>
                                                            <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                                                        </span>
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p className="text-sm text-gray-900">{activity.title}</p>
                                                            <p className="text-sm text-gray-500">{activity.description}</p>
                                                        </div>
                                                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                            {format(activity.time, 'h:mm a')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        to="/boards"
                        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
                    >
                        <ViewColumnsIcon className="h-8 w-8 mb-2" />
                        <p className="font-medium">Manage Boards</p>
                        <p className="text-sm text-blue-100 mt-1">{totalBoards} active</p>
                    </Link>
                    <Link
                        to="/tasks"
                        className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
                    >
                        <DocumentTextIcon className="h-8 w-8 mb-2" />
                        <p className="font-medium">View Tasks</p>
                        <p className="text-sm text-green-100 mt-1">{pendingTasks} pending</p>
                    </Link>
                    <Link
                        to="/team"
                        className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                        <UserGroupIcon className="h-8 w-8 mb-2" />
                        <p className="font-medium">Team Management</p>
                        <p className="text-sm text-purple-100 mt-1">View team</p>
                    </Link>
                    <Link
                        to="/profile"
                        className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg p-4 hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-105"
                    >
                        <UserGroupIcon className="h-8 w-8 mb-2" />
                        <p className="font-medium">Your Profile</p>
                        <p className="text-sm text-pink-100 mt-1">Settings</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
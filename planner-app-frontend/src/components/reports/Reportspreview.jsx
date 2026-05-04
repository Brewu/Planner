import React, { useState, useEffect } from 'react';
import { DocumentIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ReportPreview = ({ boardData, tasks, statistics, onConfirm, onCancel }) => {
    const [reportPeriod, setReportPeriod] = useState({
        startDate: null,
        endDate: null,
    });

    useEffect(() => {
        // Calculate week start and end
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        setReportPeriod({
            startDate: start,
            endDate: end,
        });
    }, []);

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateRange = () => {
        if (!reportPeriod.startDate || !reportPeriod.endDate) return '';
        const start = reportPeriod.startDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
        });
        const end = reportPeriod.endDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        return `${start} – ${end}`;
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                    <div className="flex items-center space-x-2">
                        <DocumentIcon className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Preview Content */}
                <div className="px-8 py-8 bg-white">
                    {/* ──── ORGANIZATION HEADER ──── */}
                    <div className="text-center mb-8 pb-6 border-b-4 border-gray-800">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            Your Organization Name
                        </h1>
                        <p className="text-sm font-medium text-green-700 mb-1">
                            Planning & Strategy Division
                        </p>
                        <p className="text-sm font-medium text-blue-700">
                            Weekly Report
                        </p>
                    </div>

                    {/* ──── REPORT METADATA ──── */}
                    <div className="mb-8 space-y-3 text-sm">
                        <div>
                            <span className="font-semibold text-gray-900">
                                Reporting Period:
                            </span>
                            <span className="ml-2 text-gray-700">
                                {formatDateRange()}, {new Date().getFullYear()}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900">
                                NAME OF PERSON REPORTING:
                            </span>
                            <span className="ml-2 text-gray-700">
                                ......[Reporter Name]
                            </span>
                        </div>
                        <div className="ml-6 italic text-gray-600">
                            Rank/Title: National Service Personnel (NSP)
                        </div>
                    </div>

                    {/* ──── BOARD/PROJECT NAME ──── */}
                    <div className="mb-8 pb-4 border-b border-gray-300">
                        <h2 className="text-xl font-bold text-gray-900">
                            {boardData?.name || 'Project Name'}
                        </h2>
                    </div>

                    {/* ──── SUMMARY STATISTICS ──── */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Summary Statistics
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="border border-gray-300 rounded p-4">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                    Total Tasks
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {statistics?.totalTasks || 0}
                                </p>
                            </div>
                            <div className="border border-gray-300 rounded p-4">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                    Completed
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {statistics?.completed || 0}
                                </p>
                            </div>
                            <div className="border border-gray-300 rounded p-4">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                    Completion %
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {statistics?.completionPercentage?.toFixed(1) || 0}%
                                </p>
                            </div>
                            <div className="border border-gray-300 rounded p-4">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                    In Progress
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {statistics?.inProgress || 0}
                                </p>
                            </div>
                            <div className="border border-gray-300 rounded p-4">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                    Pending
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {statistics?.pending || 0}
                                </p>
                            </div>
                            <div className="border border-gray-300 rounded p-4">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                    Overdue
                                </p>
                                <p className="text-2xl font-bold text-green-700">
                                    {statistics?.overdueTasks || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ──── TASKS TABLE ──── */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Task Details
                        </h3>
                        <div className="border border-gray-400 rounded overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="border-r border-gray-400 px-4 py-3 text-left font-semibold w-12">
                                            No.
                                        </th>
                                        <th className="border-r border-gray-400 px-4 py-3 text-left font-semibold w-1/4">
                                            Task Category
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Remark
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks && tasks.length > 0 ? (
                                        tasks.map((task, idx) => (
                                            <tr key={task.id} className="border-t border-gray-400 hover:bg-gray-50">
                                                <td className="border-r border-gray-400 px-4 py-3 text-center font-medium text-gray-700">
                                                    {idx + 1}
                                                </td>
                                                <td className="border-r border-gray-400 px-4 py-3">
                                                    <div className="font-semibold text-gray-900">
                                                        {task.title}
                                                    </div>
                                                    {task.status && (
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            [{task.status.toUpperCase()}]
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-700">
                                                        {task.description || '(No description)'}
                                                    </div>
                                                    {task.dueDate && (
                                                        <div className="text-xs text-gray-600 mt-2">
                                                            Due: {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </div>
                                                    )}
                                                    {task.assignedTo && (
                                                        <div className="text-xs text-gray-600">
                                                            Assigned to: {task.assignedTo}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="border-t border-gray-400">
                                            <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                                                No tasks to display
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ──── FOOTER ──── */}
                    <div className="border-t border-gray-300 pt-6 text-center text-xs text-gray-500">
                        <p>Report generated on {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })} at {new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })}</p>
                        <p className="mt-2">This is an automated report from PlannerApp.</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        Back
                    </button>
                    <button
                        onClick={onConfirm}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Confirm & Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportPreview;
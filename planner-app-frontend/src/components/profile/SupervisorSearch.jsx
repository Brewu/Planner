import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SupervisorSearch = ({ userId, currentSupervisorId, onClose, onAssigned }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [frequency, setFrequency] = useState('Weekly');
    const [assigning, setAssigning] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState(null);

    const frequencies = [ 'Weekly', 'Monthly', 'Yearly'];

    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        // Debounce search
        if (debounceTimer) clearTimeout(debounceTimer);

        const timer = setTimeout(() => {
            searchUsers();
        }, 500);

        setDebounceTimer(timer);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const searchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/Supervisors/search?name=${encodeURIComponent(searchTerm)}`);
            // Filter out current user and current supervisor
            const filtered = response.data.filter(u =>
                u.id !== userId && u.id !== currentSupervisorId
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error('Error searching users:', error);
            toast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedSupervisor) {
            toast.error('Please select a supervisor');
            return;
        }

        try {
            setAssigning(true);
            await api.post('/Supervisors/request', {
                requesterId: userId,
                supervisorId: selectedSupervisor.id,
                frequency: frequency
            });

            toast.success(`Request sent to ${selectedSupervisor.name}! Waiting for their approval.`);
            onAssigned();
        } catch (error) {
            const status = error.response?.status;
            if (status === 409) {
                toast.error('You already have a pending request with this supervisor.');
            } else {
                toast.error(error.response?.data || 'Failed to send request');
            }
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <div className="mt-3 text-center sm:mt-0 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Assign Supervisor
                            </h3>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Search for supervisor
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Enter name to search..."
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    autoFocus
                                />
                            </div>

                            {/* Search Results */}
                            {searchTerm.length >= 2 && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Results
                                    </label>
                                    {loading ? (
                                        <div className="flex justify-center py-4">
                                            <LoadingSpinner size="medium" />
                                        </div>
                                    ) : (
                                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        onClick={() => setSelectedSupervisor(user)}
                                                        className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedSupervisor?.id === user.id
                                                            ? 'bg-blue-50 border-l-4 border-blue-500'
                                                            : ''
                                                            }`}
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                        {user.email && (
                                                            <p className="text-xs text-gray-500">{user.email}</p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="p-3 text-sm text-gray-500">No users found</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Frequency Selection */}
                            {selectedSupervisor && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reporting Frequency
                                    </label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    >
                                        {frequencies.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-gray-500">
                                        How often will you report to {selectedSupervisor.name}?
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={handleAssign}
                            disabled={!selectedSupervisor || assigning}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {assigning ? <LoadingSpinner /> : 'Send Request'}                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisorSearch;
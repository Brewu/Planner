import React, { useState, useEffect } from 'react';
import { useBoards } from '../../contexts/BoardContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MAX_SUPERVISEES = 3;

const frequencyColors = {
    Weekly: 'bg-blue-100 text-blue-800',
    Monthly: 'bg-green-100 text-green-800',
    Yearly: 'bg-yellow-100 text-yellow-800',
};

const CreateBoardModal = ({ onClose, onBoardCreated }) => {
    const { createBoard } = useBoards();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [supervisees, setSupervisees] = useState([]);      // full team list
    const [loadingSupervisees, setLoadingSupervisees] = useState(true);
    const [selectedSupervisees, setSelectedSupervisees] = useState([]);
    const [commonFrequency, setCommonFrequency] = useState('Weekly');
    const [formData, setFormData] = useState({ name: '' });

    const frequencies = ['Weekly', 'Monthly', 'Yearly'];

    // Derived state
    const selectedCount = selectedSupervisees.length;
    const showFrequencyPicker = selectedCount >= 1; // show for any supervisee selection

    useEffect(() => {
        if (!user?.id) return;
        const fetchSupervisees = async () => {
            try {
                setLoadingSupervisees(true);
                const response = await api.get(`/Supervisors/my-team/${user.id}`);
                setSupervisees(response.data || []);
            } catch (error) {
                console.error('Error fetching supervisees:', error);
                toast.error('Failed to load your team');
            } finally {
                setLoadingSupervisees(false);
            }
        };
        fetchSupervisees();
    }, [user]);

    const toggleSupervisee = (supervisee) => {
        const isSelected = selectedSupervisees.some(s => s.id === supervisee.id);
        if (isSelected) {
            setSelectedSupervisees(prev => prev.filter(s => s.id !== supervisee.id));
        } else {
            if (selectedCount >= MAX_SUPERVISEES) {
                toast.error(`You can assign up to ${MAX_SUPERVISEES} supervisees per board.`);
                return;
            }
            setSelectedSupervisees(prev => [...prev, supervisee]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Board name is required');
            return;
        }

        // Frequency logic:
        // - 0 supervisees: no frequency (personal board, backend default applies)
        // - 1-3 supervisees: use the frequency picker value
        const frequencyMap = { Weekly: 0, Monthly: 1, Yearly: 2 };
        const frequency = selectedCount >= 1 ? frequencyMap[commonFrequency] : 0;

        const boardData = {
            name: formData.name.trim(),
            frequency: frequency ?? 0, // default to Weekly if solo board (backend may ignore it)
            supervisorId: user.id,     // creator is always the supervisor
            assignedUserIds: selectedSupervisees.map(s => s.id),
        };

        setLoading(true);
        const result = await createBoard(boardData);
        setLoading(false);

        if (result.success) {
            toast.success('Board created successfully!');
            onBoardCreated();
            onClose();
        }
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Create New Board
                        </h3>

                        {/* Board Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Board Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., Q1 Planning"
                                required
                            />
                        </div>

                        {/* Supervisee Selection */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Assign Supervisees
                                    <span className="ml-1 text-xs text-gray-400">(up to {MAX_SUPERVISEES})</span>
                                </label>
                                {selectedCount > 0 && (
                                    <span className="text-xs text-blue-600 font-medium">
                                        {selectedCount} selected
                                    </span>
                                )}
                            </div>

                            {loadingSupervisees ? (
                                <div className="flex items-center gap-2 py-3">
                                    <LoadingSpinner size="small" />
                                    <span className="text-sm text-gray-500">Loading your team...</span>
                                </div>
                            ) : supervisees.length === 0 ? (
                                <div className="border border-gray-200 rounded-md px-4 py-3">
                                    <p className="text-sm text-gray-500">
                                        You have no supervisees yet. This board will be for your personal use.
                                    </p>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                    {supervisees.map((supervisee) => {
                                        const isSelected = selectedSupervisees.some(s => s.id === supervisee.id);
                                        const isDisabled = !isSelected && selectedCount >= MAX_SUPERVISEES;
                                        return (
                                            <div
                                                key={supervisee.id}
                                                onClick={() => !isDisabled && toggleSupervisee(supervisee)}
                                                className={`flex items-center justify-between px-3 py-2.5 transition-colors
                                                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                                                    ${isSelected ? 'bg-blue-50' : ''}
                                                `}
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{supervisee.name}</p>
                                                    {supervisee.email && (
                                                        <p className="text-xs text-gray-500">{supervisee.email}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                                    {supervisee.reportingFrequency && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${frequencyColors[supervisee.reportingFrequency] ?? 'bg-gray-100 text-gray-800'}`}>
                                                            {supervisee.reportingFrequency}
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <CheckIcon className="h-4 w-4 text-blue-600" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Helper text below the list */}
                            {selectedCount === 0 && supervisees.length > 0 && (
                                <p className="mt-1.5 text-xs text-gray-400">
                                    No supervisees selected — this board will be for your personal use.
                                </p>
                            )}
                        </div>

                        {/* Frequency Picker — shown when 1+ supervisees selected */}
                        {showFrequencyPicker && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reporting Frequency
                                </label>
                                <select
                                    value={commonFrequency}
                                    onChange={(e) => setCommonFrequency(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    {frequencies.map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                                {selectedCount > 1 && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        This frequency will apply to all {selectedCount} selected supervisees for this board.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                            >
                                {loading ? <LoadingSpinner /> : 'Create Board'}
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

export default CreateBoardModal; 
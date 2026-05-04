import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SuperviseeSearch = ({ supervisorId, onClose, onSent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [frequency, setFrequency] = useState('Weekly');
    const [sending, setSending] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState(null);

    const frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

    useEffect(() => {
        if (searchTerm.length < 2) { setSearchResults([]); return; }
        if (debounceTimer) clearTimeout(debounceTimer);
        const timer = setTimeout(searchUsers, 500);
        setDebounceTimer(timer);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const searchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/Supervisors/search?name=${encodeURIComponent(searchTerm)}`);
            setSearchResults(response.data.filter(u => u.id !== supervisorId));
        } catch {
            toast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!selected) { toast.error('Please select a user'); return; }
        try {
            setSending(true);
            await api.post('/Supervisors/supervisee-request', {
                supervisorId,
                superviseeId: selected.id,
                frequency
            });
            toast.success(`Invitation sent to ${selected.name}!`);
            onSent();
        } catch (error) {
            const status = error.response?.status;
            if (status === 409) {
                toast.error('A pending request already exists with this user.');
            } else {
                toast.error(error.response?.data || 'Failed to send invitation');
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Invite Supervisee
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Search user</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Enter name to search..."
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            autoFocus
                        />
                    </div>

                    {searchTerm.length >= 2 && (
                        <div className="mt-4">
                            {loading ? (
                                <div className="flex justify-center py-4"><LoadingSpinner size="medium" /></div>
                            ) : (
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                                    {searchResults.length > 0 ? searchResults.map((u) => (
                                        <div
                                            key={u.id}
                                            onClick={() => setSelected(u)}
                                            className={`p-3 cursor-pointer hover:bg-gray-50 ${selected?.id === u.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                        >
                                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                            {u.email && <p className="text-xs text-gray-500">{u.email}</p>}
                                        </div>
                                    )) : (
                                        <p className="p-3 text-sm text-gray-500">No users found</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {selected && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Frequency</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                {frequencies.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs text-gray-500">
                                How often will {selected.name} report to you?
                            </p>
                        </div>
                    )}

                    <div className="mt-5 sm:grid sm:grid-cols-2 sm:gap-3">
                        <button
                            onClick={handleSend}
                            disabled={!selected || sending}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:text-sm"
                        >
                            {sending ? <LoadingSpinner /> : 'Send Invitation'}
                        </button>
                        <button
                            onClick={onClose}
                            className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperviseeSearch;
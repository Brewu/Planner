import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const frequencies = ['Weekly', 'Monthly', 'Yearly'];

const frequencyColors = {
    Daily:   'bg-purple-100 text-purple-800',
    Weekly:  'bg-blue-100 text-blue-800',
    Monthly: 'bg-green-100 text-green-800',
    Yearly:  'bg-yellow-100 text-yellow-800',
};

// Inline frequency editor for a single supervisee row
const FrequencyEditor = ({ member, onUpdated }) => {
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState(member.reportingFrequency ?? 'Weekly');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (selected === member.reportingFrequency) { setEditing(false); return; }
        try {
            setSaving(true);
            await api.patch(`/Supervisors/update-frequency/${member.id}`, { frequency: selected });
            toast.success(`Frequency updated for ${member.name}.`);
            setEditing(false);
            onUpdated();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to update frequency');
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <div className="flex items-center gap-2">
                {member.reportingFrequency ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${frequencyColors[member.reportingFrequency] ?? 'bg-gray-100 text-gray-800'}`}>
                        {member.reportingFrequency}
                    </span>
                ) : (
                    <span className="text-xs text-gray-400">No frequency</span>
                )}
                <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                >
                    Change
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={saving}
                className="text-xs border border-gray-300 rounded-md py-1 pl-2 pr-6 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
                {frequencies.map(f => (
                    <option key={f} value={f}>{f}</option>
                ))}
            </select>
            <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-md disabled:opacity-50"
            >
                {saving ? '...' : 'Save'}
            </button>
            <button
                onClick={() => { setEditing(false); setSelected(member.reportingFrequency ?? 'Weekly'); }}
                className="text-xs text-gray-500 hover:text-gray-700"
            >
                Cancel
            </button>
        </div>
    );
};

const TeamManagement = () => {
    const { user } = useAuth();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, weekly: 0, monthly: 0, yearly: 0 });

    useEffect(() => {
        fetchTeam();
    }, [user]);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/Supervisors/my-team/${user.id}`);
            setTeam(response.data);
            setStats({
                total: response.data.length,
                weekly:  response.data.filter(m => m.reportingFrequency === 'Weekly').length,
                monthly: response.data.filter(m => m.reportingFrequency === 'Monthly').length,
                yearly:  response.data.filter(m => m.reportingFrequency === 'Yearly').length,
            });
        } catch (error) {
            console.error('Error fetching team:', error);
            toast.error('Failed to load team');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">My Team</h1>
                <p className="mt-1 text-sm text-gray-500">Manage and monitor your team members</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[
                    { label: 'Total Team',       value: stats.total,   icon: <UsersIcon className="h-6 w-6 text-gray-400" /> },
                    { label: 'Weekly Reports',   value: stats.weekly,  icon: <ChartBarIcon className="h-6 w-6 text-blue-400" /> },
                    { label: 'Monthly Reports',  value: stats.monthly, icon: <ChartBarIcon className="h-6 w-6 text-green-400" /> },
                    { label: 'Yearly Reports',   value: stats.yearly,  icon: <ChartBarIcon className="h-6 w-6 text-yellow-400" /> },
                ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">{icon}</div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                                        <dd className="text-lg font-medium text-gray-900">{value}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Members List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        People reporting to you — set their reporting frequency here
                    </p>
                </div>

                {team.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {team.map((member) => (
                            <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-600 truncate">
                                            {member.name}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {member.email || member.phoneNumber}
                                        </p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <FrequencyEditor member={member} onUpdated={fetchTeam} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="px-4 py-8 text-center">
                        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            You don't have anyone reporting to you yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamManagement;
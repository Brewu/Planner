import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Must match the backend ReportingFrequency enum exactly
const frequencies = ['Weekly', 'Monthly', 'Yearly'];

const ReportingFrequency = ({ currentFrequency, userId, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [frequency, setFrequency] = useState(currentFrequency);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.patch(`/Supervisors/update-frequency/${userId}`, {
                frequency,
            });
            toast.success('Reporting frequency updated.');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error updating frequency:', error);
            toast.error(error.response?.data || 'Failed to update frequency');
        } finally {
            setSaving(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{currentFrequency}</span>
                <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                >
                    Change
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                disabled={saving}
            >
                {frequencies.map((f) => (
                    <option key={f} value={f}>{f}</option>
                ))}
            </select>
            <div className="flex space-x-2">
                <button
                    onClick={handleSave}
                    disabled={saving || frequency === currentFrequency}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setFrequency(currentFrequency);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ReportingFrequency;
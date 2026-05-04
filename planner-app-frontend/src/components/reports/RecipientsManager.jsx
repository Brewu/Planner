// src/components/profile/RecipientsManager.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    EnvelopeIcon,
    PlusCircleIcon,
    TrashIcon,
    XMarkIcon,
    CheckCircleIcon,
    ClockIcon,
    UsersIcon
} from '@heroicons/react/24/outline';

const RecipientsManager = ({ userId }) => {
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        type: 'TO'
    });

    useEffect(() => {
        fetchRecipients();
    }, [userId]);

    // src/components/reports/RecipientsManager.jsx - Update the API calls

    const fetchRecipients = async () => {
        try {
            setLoading(true);
            // Use the new endpoint
            const response = await api.get(`/recipients`);
            setRecipients(response.data || []);
        } catch (error) {
            console.error('Error fetching recipients:', error);
            toast.error('Failed to load recipients');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRecipient = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast.error('Name and email are required');
            return;
        }

        try {
            // Use the new endpoint
            const response = await api.post('/recipients', formData);
            toast.success('Recipient added successfully');
            setShowAddForm(false);
            setFormData({ name: '', email: '', type: 'TO' });
            fetchRecipients();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add recipient');
        }
    };

    const handleUpdateRecipient = async (e) => {
        e.preventDefault();
        try {
            // Use the new endpoint
            await api.put(`/recipients/${editingRecipient.id}`, formData);
            toast.success('Recipient updated successfully');
            setEditingRecipient(null);
            setFormData({ name: '', email: '', type: 'TO' });
            fetchRecipients();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update recipient');
        }
    };

    const handleDeleteRecipient = async (recipientId, recipientName) => {
        if (!window.confirm(`Are you sure you want to delete ${recipientName}?`)) return;

        try {
            // Use the new endpoint
            await api.delete(`/recipients/${recipientId}`);
            toast.success('Recipient deleted successfully');
            fetchRecipients();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete recipient');
        }
    };

    const getTypeBadge = (type) => {
        const styles = {
            TO: 'bg-blue-100 text-blue-800',
            CC: 'bg-green-100 text-green-800',
            BCC: 'bg-purple-100 text-purple-800'
        };
        return styles[type] || 'bg-gray-100 text-gray-800';
    };

    const groupedRecipients = {
        TO: recipients.filter(r => r.type === 'TO'),
        CC: recipients.filter(r => r.type === 'CC'),
        BCC: recipients.filter(r => r.type === 'BCC')
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading recipients...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Report Recipients</h3>
                    <p className="text-sm text-gray-500">Manage email recipients for sending reports</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
                >
                    <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                    Add Recipient
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {(showAddForm || editingRecipient) && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => {
                            setShowAddForm(false);
                            setEditingRecipient(null);
                            setFormData({ name: '', email: '', type: 'TO' });
                        }} />
                        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingRecipient(null);
                                            setFormData({ name: '', email: '', type: 'TO' });
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                <form onSubmit={editingRecipient ? handleUpdateRecipient : handleAddRecipient}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., John Doe"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="john@example.com"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Recipient Type
                                            </label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="TO">TO - Primary Recipient</option>
                                                <option value="CC">CC - Carbon Copy</option>
                                                <option value="BCC">BCC - Blind Carbon Copy</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formData.type === 'TO' && 'Main recipient who will see the report'}
                                                {formData.type === 'CC' && 'Visible to all, usually for information'}
                                                {formData.type === 'BCC' && 'Hidden from others, for private distribution'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
                                        >
                                            {editingRecipient ? 'Update' : 'Add'} Recipient
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setEditingRecipient(null);
                                                setFormData({ name: '', email: '', type: 'TO' });
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recipients Lists */}
            <div className="space-y-6">
                {['TO', 'CC', 'BCC'].map((type) => (
                    <div key={type} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className={`px-4 py-3 ${type === 'TO' ? 'bg-blue-50' : type === 'CC' ? 'bg-green-50' : 'bg-purple-50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <EnvelopeIcon className={`h-5 w-5 ${type === 'TO' ? 'text-blue-600' : type === 'CC' ? 'text-green-600' : 'text-purple-600'}`} />
                                    <h4 className="font-semibold text-gray-900">
                                        {type === 'TO' ? 'Primary Recipients (TO)' : type === 'CC' ? 'Carbon Copy (CC)' : 'Blind Carbon Copy (BCC)'}
                                    </h4>
                                    <span className="text-xs text-gray-500">({groupedRecipients[type].length})</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                {type === 'TO' && 'Main recipients who will receive the report directly'}
                                {type === 'CC' && 'Additional recipients who will receive a copy'}
                                {type === 'BCC' && 'Hidden recipients - others won\'t see them'}
                            </p>
                        </div>
                        {groupedRecipients[type].length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                No {type} recipients added yet
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {groupedRecipients[type].map((recipient) => (
                                    <div key={recipient.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{recipient.name}</p>
                                            <p className="text-sm text-gray-500">{recipient.email}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Added {new Date(recipient.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingRecipient(recipient);
                                                    setFormData({
                                                        name: recipient.name,
                                                        email: recipient.email,
                                                        type: recipient.type
                                                    });
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRecipient(recipient.id, recipient.name)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <UsersIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">How recipients work</p>
                        <p className="text-xs text-blue-700 mt-1">
                            • <strong>TO</strong> recipients are the main recipients of your reports<br />
                            • <strong>CC</strong> recipients receive copies and are visible to everyone<br />
                            • <strong>BCC</strong> recipients receive copies but are hidden from others<br />
                            • You can select these recipients when sending a report
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipientsManager;
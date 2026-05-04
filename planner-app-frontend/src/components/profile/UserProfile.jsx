import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import SupervisorSearch from './SupervisorSearch';
import SuperviseeSearch from '../supervisor/SuperviseeSearch';
import RecipientsManager from '../reports/RecipientsManager';
import toast from 'react-hot-toast';
import {
    UserCircleIcon,
    EnvelopeIcon,
    BriefcaseIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    KeyIcon,
    XMarkIcon,
    PlusCircleIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';

const frequencyColors = {
    Daily: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '📅' },
    Weekly: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📆' },
    Monthly: { bg: 'bg-green-100', text: 'text-green-800', icon: '📊' },
    Yearly: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '📅' },
};

const UserProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSupervisorSearch, setShowSupervisorSearch] = useState(false);
    const [showSuperviseeSearch, setShowSuperviseeSearch] = useState(false);
    const [showAccountSettings, setShowAccountSettings] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [supervisors, setSupervisors] = useState([]);
    const [team, setTeam] = useState([]);
    const [superviseeInvitations, setSuperviseeInvitations] = useState([]);
    const [responding, setResponding] = useState(null);
    const [removingSupervisor, setRemovingSupervisor] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Password change states
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        Promise.all([fetchUserProfile(), fetchSupervisors(), fetchTeam(), fetchSuperviseeInvitations()]);
    }, [user]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/Supervisors/${user.id}`);
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const response = await api.get(`/Supervisors/${user.id}/supervisors`);
            setSupervisors(response.data || []);
        } catch (error) {
            console.error('Error fetching supervisors:', error);
        }
    };

    const fetchTeam = async () => {
        try {
            const response = await api.get(`/Supervisors/my-team/${user.id}`);
            setTeam(response.data || []);
        } catch (error) {
            console.error('Error fetching team:', error);
        }
    };

    const fetchSuperviseeInvitations = async () => {
        try {
            const response = await api.get(`/Supervisors/requests/supervisee-incoming/${user.id}`);
            setSuperviseeInvitations(response.data || []);
        } catch (error) {
            console.error('Error fetching supervisee invitations:', error);
        }
    };

    const handleRespondToInvitation = async (requestId, accept) => {
        try {
            setResponding(requestId);
            await api.post('/Supervisors/request/respond', { requestId, accept });
            toast.success(accept ? 'Invitation accepted!' : 'Invitation declined.');
            await Promise.all([fetchSuperviseeInvitations(), fetchSupervisors()]);
            if (accept) fetchUserProfile();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to respond to invitation');
        } finally {
            setResponding(null);
        }
    };

    const handleRemoveSupervisor = async (supervisorId, supervisorName) => {
        if (!window.confirm(`Are you sure you want to remove ${supervisorName} as your supervisor?`)) return;
        try {
            setRemovingSupervisor(true);
            await api.delete(`/Supervisors/remove-supervisor/${user.id}?supervisorId=${supervisorId}`);
            toast.success(`Supervisor ${supervisorName} removed.`);
            await fetchSupervisors();
            await fetchUserProfile();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to remove supervisor');
        } finally {
            setRemovingSupervisor(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setUpdatingPassword(true);
        try {
            await api.post('/Users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowChangePassword(false);
            setShowAccountSettings(false);
        } catch (error) {
            const message = error.response?.data || 'Failed to change password';
            toast.error(typeof message === 'string' ? message : JSON.stringify(message));
        } finally {
            setUpdatingPassword(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Tab configuration
    const tabs = [
        { id: 'profile', label: 'Profile', icon: UserCircleIcon },
        { id: 'supervisors', label: 'Supervisors', icon: ShieldCheckIcon, count: supervisors.length },
        { id: 'team', label: 'Team', icon: UserGroupIcon, count: team.length },
        { id: 'recipients', label: 'Recipients', icon: EnvelopeIcon }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-sm text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                            <UserCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage your account, relationships, and report recipients</p>
                        </div>
                    </div>
                </div>

                {/* Supervisee Invitations Banner */}
                {superviseeInvitations.length > 0 && (
                    <div className="mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <UserPlusIcon className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Supervisor Invitations ({superviseeInvitations.length})
                                        </h3>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            You have pending supervisor requests
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-2">
                                {superviseeInvitations.map((req) => (
                                    <div key={req.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{req.supervisor.name}</p>
                                            <p className="text-xs text-gray-500">{req.supervisor.email}</p>
                                            <p className="text-xs text-blue-600 mt-0.5">Invited you to report to them</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRespondToInvitation(req.id, true)}
                                                disabled={responding === req.id}
                                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                                            >
                                                {responding === req.id ? <LoadingSpinner size="small" /> : 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleRespondToInvitation(req.id, false)}
                                                disabled={responding === req.id}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Tabs */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                                        ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                                            ${activeTab === tab.id
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                            <div className="flex-1" />
                            <button
                                onClick={() => setShowAccountSettings(true)}
                                className="my-2 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                            >
                                <KeyIcon className="h-4 w-4 mr-1.5" />
                                Settings
                            </button>
                        </nav>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="p-6">
                            <div className="flex items-start space-x-6">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                        <span className="text-3xl font-bold text-white">
                                            {getInitials(profile?.name)}
                                        </span>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                <UserCircleIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                                Full Name
                                            </label>
                                            <p className="text-base font-semibold text-gray-900">{profile?.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                <EnvelopeIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                                Email Address
                                            </label>
                                            <p className="text-base text-gray-900">{profile?.email || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                <BriefcaseIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                                Staff ID
                                            </label>
                                            <p className="text-base text-gray-900">{profile?.staffId || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                <UserGroupIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                                                Position
                                            </label>
                                            <p className="text-base text-gray-900">{profile?.position || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Supervisors Tab */}
                    {activeTab === 'supervisors' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Your Supervisors</h3>
                                    <p className="text-sm text-gray-500">Manage your supervisor relationships</p>
                                </div>
                                <button
                                    onClick={() => setShowSupervisorSearch(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                                >
                                    <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                                    Add Supervisor
                                </button>
                            </div>

                            {supervisors.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheckIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No supervisors assigned yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Add a supervisor to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {supervisors.map((supervisor) => {
                                        const freqInfo = frequencyColors[supervisor.reportingFrequency] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📋' };
                                        return (
                                            <div key={supervisor.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                                                            <span className="text-base font-bold text-white">
                                                                {getInitials(supervisor.name)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{supervisor.name}</p>
                                                            <p className="text-xs text-gray-500">{supervisor.email}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {supervisor.reportingFrequency && (
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${freqInfo.bg} ${freqInfo.text}`}>
                                                                        <span>{freqInfo.icon}</span>
                                                                        {supervisor.reportingFrequency}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-gray-400">
                                                                    Since {new Date(supervisor.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveSupervisor(supervisor.id, supervisor.name)}
                                                        disabled={removingSupervisor}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                                        title="Remove supervisor"
                                                    >
                                                        <XMarkIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Your Team</h3>
                                    <p className="text-sm text-gray-500">People who report to you</p>
                                </div>
                                <button
                                    onClick={() => setShowSuperviseeSearch(true)}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-all shadow-sm"
                                >
                                    <UserPlusIcon className="h-4 w-4 mr-1.5" />
                                    Invite Member
                                </button>
                            </div>

                            {team.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <UserGroupIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">No team members yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Invite someone to join your team</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {team.map((member) => {
                                        const freqInfo = frequencyColors[member.reportingFrequency] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📋' };
                                        return (
                                            <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                                                        <span className="text-sm font-bold text-white">
                                                            {getInitials(member.name)}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">{member.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                                        {member.reportingFrequency && (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${freqInfo.bg} ${freqInfo.text}`}>
                                                                <span>{freqInfo.icon}</span>
                                                                {member.reportingFrequency}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recipients Tab */}
                    {activeTab === 'recipients' && (
                        <div className="p-6">
                            <RecipientsManager userId={user.id} />
                        </div>
                    )}
                </div>

                {/* Account Settings Modal */}
                {showAccountSettings && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 py-8">
                            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowAccountSettings(false)} />
                            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                                        <button onClick={() => setShowAccountSettings(false)} className="text-gray-400 hover:text-gray-600">
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAccountSettings(false);
                                            setShowChangePassword(true);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                <KeyIcon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Change Password</p>
                                                <p className="text-sm text-gray-500">Update your account password</p>
                                            </div>
                                        </div>
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change Password Modal */}
                {showChangePassword && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 py-8">
                            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowChangePassword(false)} />
                            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />
                                <form onSubmit={handleChangePassword}>
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                                            <button onClick={() => setShowChangePassword(false)} className="text-gray-400 hover:text-gray-600">
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter current password"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter new password"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
                                        <button
                                            type="submit"
                                            disabled={updatingPassword}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                                        >
                                            {updatingPassword ? <LoadingSpinner size="small" /> : 'Update Password'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowChangePassword(false)}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modals */}
                {showSupervisorSearch && (
                    <SupervisorSearch
                        userId={user.id}
                        currentSupervisorIds={supervisors.map(s => s.id)}
                        onClose={() => setShowSupervisorSearch(false)}
                        onAssigned={() => {
                            setShowSupervisorSearch(false);
                            Promise.all([fetchUserProfile(), fetchSupervisors()]);
                        }}
                    />
                )}

                {showSuperviseeSearch && (
                    <SuperviseeSearch
                        supervisorId={user.id}
                        onClose={() => setShowSuperviseeSearch(false)}
                        onSent={() => {
                            setShowSuperviseeSearch(false);
                            fetchTeam();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default UserProfile;
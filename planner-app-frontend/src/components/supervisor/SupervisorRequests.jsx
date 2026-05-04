import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const SupervisorRequests = () => {
    const { user } = useAuth();
    const [incoming, setIncoming] = useState([]);
    const [superviseeInvites, setSuperviseeInvites] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null);
    const [cancelling, setCancelling] = useState(null);
    const [clearingResolved, setClearingResolved] = useState(false);

    const resolvedOutgoing = outgoing.filter(r => r.status !== 'Pending');

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const fetchRequests = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const [inRes, inviteRes, outRes] = await Promise.all([
                api.get(`/Supervisors/requests/supervisor-incoming/${user.id}`), // ✅ FIXED
                api.get(`/Supervisors/requests/supervisee-incoming/${user.id}`),
                api.get(`/Supervisors/requests/outgoing/${user.id}`) // ⚠️ STILL WRONG (see below)
            ]);
            setIncoming(inRes.data || []);
            setSuperviseeInvites(inviteRes.data || []);
            setOutgoing(outRes.data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId, accept) => {
        try {
            setResponding(requestId);
            await api.post('/Supervisors/request/respond', { requestId, accept });
            toast.success(accept ? 'Request accepted!' : 'Request declined.');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to respond to request');
        } finally {
            setResponding(null);
        }
    };

    const handleCancel = async (requestId) => {
        try {
            setCancelling(requestId);
            await api.delete(`/Supervisors/request/${requestId}?requesterId=${user.id}`);
            toast.success('Request cancelled.');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data || 'Failed to cancel request');
        } finally {
            setCancelling(null);
        }
    };

    // FIXED: Actually delete resolved requests from backend
    const handleClearResolved = async () => {
        if (resolvedOutgoing.length === 0) return;

        // Confirm with user
        if (!window.confirm(`Are you sure you want to clear ${resolvedOutgoing.length} resolved request(s)?`)) {
            return;
        }

        try {
            setClearingResolved(true);

            // Call backend to delete resolved requests
            await api.delete(`/Supervisors/requests/resolved?userId=${user.id}`);

            // Update UI by removing resolved requests
            setOutgoing(prev => prev.filter(r => r.status === 'Pending'));

            toast.success(`Cleared ${resolvedOutgoing.length} resolved request(s)`);
        } catch (error) {
            console.error('Error clearing resolved requests:', error);
            toast.error(error.response?.data || 'Failed to clear resolved requests');
        } finally {
            setClearingResolved(false);
        }
    };

    const statusBadge = (status) => {
        const styles = {
            Pending: 'bg-yellow-100 text-yellow-800',
            Accepted: 'bg-green-100 text-green-800',
            Declined: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return <div className="flex justify-center py-12"><LoadingSpinner size="large" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

            {/* ── Supervisor invitations ── */}
            <section>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Supervisor Invitations
                    {superviseeInvites.length > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {superviseeInvites.length}
                        </span>
                    )}
                </h2>
                {superviseeInvites.length === 0 ? (
                    <p className="text-sm text-gray-500">No pending invitations.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 bg-white shadow rounded-md">
                        {superviseeInvites.map((req) => (
                            <li key={req.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{req.supervisor.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {req.supervisor.email} · Reports {req.frequency}
                                        </p>
                                        <p className="text-xs text-blue-500 mt-0.5">
                                            Invited you to report to them
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRespond(req.id, true)}
                                            disabled={responding === req.id}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {responding === req.id ? <LoadingSpinner size="small" /> : 'Accept'}
                                        </button>
                                        <button
                                            onClick={() => handleRespond(req.id, false)}
                                            disabled={responding === req.id}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* ── Incoming requests ── */}
            <section>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Incoming Requests
                    {incoming.length > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {incoming.length}
                        </span>
                    )}
                </h2>
                {incoming.length === 0 ? (
                    <p className="text-sm text-gray-500">No pending requests.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 bg-white shadow rounded-md">
                        {incoming.map((req) => (
                            <li key={req.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{req.requester.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {req.requester.email} · Reports {req.frequency}
                                        </p>
                                        <p className="text-xs text-blue-500 mt-0.5">
                                            Requesting you as supervisor
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRespond(req.id, true)}
                                            disabled={responding === req.id}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {responding === req.id ? <LoadingSpinner size="small" /> : 'Accept'}
                                        </button>
                                        <button
                                            onClick={() => handleRespond(req.id, false)}
                                            disabled={responding === req.id}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* ── Sent Requests ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Sent Requests</h2>
                    {resolvedOutgoing.length > 0 && (
                        <button
                            onClick={handleClearResolved}
                            disabled={clearingResolved}
                            className="inline-flex items-center text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                            {clearingResolved ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    <span className="ml-1">Clearing...</span>
                                </>
                            ) : (
                                `Clear ${resolvedOutgoing.length} resolved`
                            )}
                        </button>
                    )}
                </div>
                {outgoing.length === 0 ? (
                    <p className="text-sm text-gray-500">No sent requests.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 bg-white shadow rounded-md">
                        {outgoing.map((req) => (
                            <li key={req.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{req.supervisor.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {req.supervisor.email} · Reports {req.frequency}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {statusBadge(req.status)}
                                        {req.status === 'Pending' && (
                                            <button
                                                onClick={() => handleCancel(req.id)}
                                                disabled={cancelling === req.id}
                                                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                            >
                                                {cancelling === req.id ? <LoadingSpinner size="small" /> : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

        </div>
    );
};

export default SupervisorRequests;
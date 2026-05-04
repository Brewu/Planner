import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    UserIcon,
    InboxIcon,
    PaperAirplaneIcon,
    ClockIcon,
    UserPlusIcon,
    UserGroupIcon,
    ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const RequestCenter = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState({ received: [], sent: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('received');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/SupervisorRequests/pending');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (requestId, approve) => {
        setProcessingId(requestId);
        try {
            await api.put(`/SupervisorRequests/${requestId}`, { approve });
            toast.success(approve ? 'Request approved successfully!' : 'Request rejected');
            await fetchRequests();
        } catch (error) {
            console.error('Error responding to request:', error);
            toast.error('Failed to process request');
        } finally {
            setProcessingId(null);
        }
    };

    const getRequestTypeInfo = (type, isReceived) => {
        if (type === 'BecomeSupervisor') {
            return {
                title: isReceived ? 'Wants you to be their supervisor' : 'You asked them to be your supervisor',
                icon: isReceived ? UserGroupIcon : UserPlusIcon,
                color: 'blue',
                bgGradient: 'from-blue-50 to-indigo-50',
                borderColor: 'border-blue-200'
            };
        } else {
            return {
                title: isReceived ? 'Wants to be your supervisee' : 'You offered to be their supervisor',
                icon: isReceived ? UserPlusIcon : UserGroupIcon,
                color: 'green',
                bgGradient: 'from-green-50 to-emerald-50',
                borderColor: 'border-green-200'
            };
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

    const RequestCard = ({ request, isReceived }) => {
        const typeInfo = getRequestTypeInfo(request.type, isReceived);
        const IconComponent = typeInfo.icon;
        const isProcessing = processingId === request.id;

        return (
            <div className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 
                border-l-4 ${typeInfo.borderColor} border-t border-r border-b border-gray-100`}>
                <div className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                            {/* Avatar */}
                            <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${typeInfo.bgGradient} 
                                flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
                                {request.requester?.name || request.target?.name ? (
                                    <span className={`text-base font-bold text-${typeInfo.color}-600`}>
                                        {getInitials(isReceived ? request.requester?.name : request.target?.name)}
                                    </span>
                                ) : (
                                    <UserIcon className={`h-6 w-6 text-${typeInfo.color}-500`} />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        {isReceived ? request.requester?.name : request.target?.name}
                                    </h3>
                                    {request.type === 'BecomeSupervisor' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            <UserGroupIcon className="h-3 w-3" />
                                            Supervisor Request
                                        </span>
                                    )}
                                    {request.type !== 'BecomeSupervisor' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            <UserPlusIcon className="h-3 w-3" />
                                            Supervisee Request
                                        </span>
                                    )}
                                </div>
                                
                                <p className="text-sm text-gray-600 mt-1">
                                    {typeInfo.title}
                                </p>
                                
                                {request.message && (
                                    <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <div className="flex items-start gap-2">
                                            <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <p className="text-sm text-gray-700 italic">
                                                "{request.message}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-3 mt-2">
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                    </p>
                                    {!isReceived && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                            Awaiting response
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Only for received requests */}
                        {isReceived && (
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => handleResponse(request.id, true)}
                                    disabled={isProcessing}
                                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    title="Approve request"
                                >
                                    {isProcessing ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full" />
                                    ) : (
                                        <CheckCircleIcon className="h-5 w-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleResponse(request.id, false)}
                                    disabled={isProcessing}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    title="Reject request"
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-sm text-gray-500">Loading requests...</p>
                </div>
            </div>
        );
    }

    const receivedCount = requests.received?.length || 0;
    const sentCount = requests.sent?.length || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                            <InboxIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Connection Requests</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage your supervisor and supervisee requests</p>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                {(receivedCount > 0 || sentCount > 0) && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Received</p>
                                    <p className="text-2xl font-bold text-blue-700">{receivedCount}</p>
                                </div>
                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <InboxIcon className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600 font-medium">Sent</p>
                                    <p className="text-2xl font-bold text-green-700">{sentCount}</p>
                                </div>
                                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <PaperAirplaneIcon className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('received')}
                                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                                    ${activeTab === 'received'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <InboxIcon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'received' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                <span>Received</span>
                                {receivedCount > 0 && (
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                                        ${activeTab === 'received'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {receivedCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                                    ${activeTab === 'sent'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <PaperAirplaneIcon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'sent' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                <span>Sent</span>
                                {sentCount > 0 && (
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                                        ${activeTab === 'sent'
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {sentCount}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Requests List */}
                    <div className="p-6">
                        {activeTab === 'received' && (
                            <>
                                {requests.received?.length > 0 ? (
                                    <div className="space-y-4">
                                        {requests.received.map((request) => (
                                            <RequestCard key={request.id} request={request} isReceived={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <InboxIcon className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No pending requests</h3>
                                        <p className="text-sm text-gray-500">
                                            You don't have any pending connection requests
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            When someone requests to connect with you, it will appear here
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'sent' && (
                            <>
                                {requests.sent?.length > 0 ? (
                                    <div className="space-y-4">
                                        {requests.sent.map((request) => (
                                            <RequestCard key={request.id} request={request} isReceived={false} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <PaperAirplaneIcon className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No sent requests</h3>
                                        <p className="text-sm text-gray-500">
                                            You haven't sent any connection requests yet
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Visit someone's profile to send a supervisor request
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <UserGroupIcon className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">About Connection Requests</h4>
                            <p className="text-xs text-gray-600 mt-1">
                                Supervisor requests allow you to establish reporting relationships. Once approved, 
                                you'll be able to share reports and collaborate more effectively. Pending requests 
                                can be managed from this page.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestCenter;
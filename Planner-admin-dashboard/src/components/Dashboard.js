import React, { useState } from 'react';
import RegisterUser from './RegisterUser';
import BulkRegister from './BulkRegister';
import UserList from './UserList';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('single');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage staff members and their access</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('single')}
                            className={`py-2 px-3 border-b-2 font-medium text-sm ${activeTab === 'single'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Single Registration
                        </button>
                        <button
                            onClick={() => setActiveTab('bulk')}
                            className={`py-2 px-3 border-b-2 font-medium text-sm ${activeTab === 'bulk'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Bulk Registration
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`py-2 px-3 border-b-2 font-medium text-sm ${activeTab === 'list'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Staff List
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'single' && <RegisterUser onSuccess={handleSuccess} />}
                    {activeTab === 'bulk' && <BulkRegister onSuccess={handleSuccess} />}
                    {activeTab === 'list' && <UserList key={refreshKey} />}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
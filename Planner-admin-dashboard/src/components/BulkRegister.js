import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import toast from 'react-hot-toast';

const BulkRegister = ({ onSuccess }) => {
    const [users, setUsers] = useState([{ name: '', email: '', position: '' }]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [nextStaffId, setNextStaffId] = useState('STAFF001');

    useEffect(() => {
        generateNextStaffId();
    }, []);

    const generateNextStaffId = async () => {
        try {
            const users = await userService.getAllUsers();
            const staffIds = users.map(user => user.staffId).filter(id => id && id.startsWith('STAFF'));

            let maxNumber = 0;
            staffIds.forEach(id => {
                const num = parseInt(id.substring(5));
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            });

            const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
            setNextStaffId(`STAFF${nextNumber}`);
        } catch (error) {
            console.error('Error generating staff ID:', error);
        }
    };

    const addUser = () => {
        setUsers([...users, { name: '', email: '', position: '' }]);
    };

    const removeUser = (index) => {
        setUsers(users.filter((_, i) => i !== index));
    };

    const handleUserChange = (index, field, value) => {
        const updatedUsers = [...users];
        updatedUsers[index][field] = value;
        setUsers(updatedUsers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResults(null);

        // Filter out empty rows
        const validUsers = users.filter(u => u.name && u.email);

        if (validUsers.length === 0) {
            toast.error('Please add at least one valid user');
            setLoading(false);
            return;
        }

        // Generate Staff IDs for each user
        let currentNumber = parseInt(nextStaffId.substring(5));
        const usersWithIds = validUsers.map((user, index) => ({
            ...user,
            staffId: `STAFF${(currentNumber + index).toString().padStart(3, '0')}`
        }));

        try {
            const response = await userService.registerBulk(usersWithIds);
            setResults(response);

            if (response.successful?.length > 0) {
                toast.success(`Successfully registered ${response.successful.length} users`);
                // Update next staff ID for future registrations
                const lastSuccess = response.successful[response.successful.length - 1];
                if (lastSuccess && lastSuccess.staffId) {
                    const lastNumber = parseInt(lastSuccess.staffId.substring(5));
                    setNextStaffId(`STAFF${(lastNumber + 1).toString().padStart(3, '0')}`);
                }
            }
            if (response.failed?.length > 0) {
                toast.error(`${response.failed.length} users failed to register`);
            }

            if (onSuccess) onSuccess();

            // Reset form after successful bulk registration
            setUsers([{ name: '', email: '', position: '' }]);
        } catch (error) {
            const message = error.response?.data || 'Failed to register users';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const template = [
            ['Name', 'Email', 'Position'],
            ['John Paul', 'john.paul@company.com', 'Software Engineer'],
            ['Jane Smith', 'jane.smith@company.com', 'Project Manager']
        ];

        const csvContent = template.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_registration_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bulk Staff Registration</h2>
                <button
                    onClick={downloadTemplate}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                >
                    Download CSV Template
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                        <p className="text-sm text-blue-800">
                            Next Staff ID to be assigned: <strong>{nextStaffId}</strong>
                        </p>
                    </div>

                    {users.map((user, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-700">Staff #{index + 1}</h3>
                                {users.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeUser(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    placeholder="Full Name *"
                                    value={user.name}
                                    onChange={(e) => handleUserChange(index, 'name', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address *"
                                    value={user.email}
                                    onChange={(e) => handleUserChange(index, 'email', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Position"
                                    value={user.position}
                                    onChange={(e) => handleUserChange(index, 'position', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                Staff ID will be auto-generated: STAFF{(parseInt(nextStaffId.substring(5)) + index).toString().padStart(3, '0')}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addUser}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
                    >
                        + Add Another Staff Member
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Registering Staff Members...' : `Register ${users.length} Staff Member(s)`}
                    </button>
                </div>
            </form>

            {/* Results Display */}
            {results && (
                <div className="mt-6 space-y-4">
                    {results.successful?.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <h3 className="font-semibold text-green-800 mb-2">Successfully Registered ({results.successful.length})</h3>
                            <div className="max-h-40 overflow-y-auto">
                                {results.successful.map((user, idx) => (
                                    <div key={idx} className="text-sm text-green-700">
                                        {user.name} ({user.email}) - Staff ID: {user.staffId || 'Generated'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.failed?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <h3 className="font-semibold text-red-800 mb-2">Registration Failed ({results.failed.length})</h3>
                            <div className="max-h-40 overflow-y-auto">
                                {results.failed.map((fail, idx) => (
                                    <div key={idx} className="text-sm text-red-700">
                                        {fail.email || 'Unknown'}: {fail.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                    <strong>How it works:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                    <li>Staff ID will be auto-generated sequentially (STAFF001, STAFF002, etc.)</li>
                    <li>Temporary password will be auto-generated and sent via email</li>
                    <li>Staff members must change their password on first login</li>
                    <li>Each staff member receives their own unique credentials</li>
                </ul>
            </div>
        </div>
    );
};

export default BulkRegister;
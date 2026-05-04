import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import toast from 'react-hot-toast';

const RegisterUser = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        position: '',
    });
    const [loading, setLoading] = useState(false);
    const [generatedStaffId, setGeneratedStaffId] = useState('');

    // Generate Staff ID when component mounts
    useEffect(() => {
        generateStaffId();
    }, []);

    const generateStaffId = async () => {
        try {
            // Fetch the latest users to determine the next Staff ID
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
            const newStaffId = `STAFF${nextNumber}`;
            setGeneratedStaffId(newStaffId);
        } catch (error) {
            console.error('Error generating staff ID:', error);
            // Fallback to a default
            setGeneratedStaffId(`STAFF${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Send all fields including the generated staffId
            const dataToSend = {
                ...formData,
                staffId: generatedStaffId
            };
            
            const response = await userService.registerUser(dataToSend);
            toast.success(response.message || 'User registered successfully! Credentials sent to email.');
            
            // Reset form and generate new Staff ID
            setFormData({
                name: '',
                email: '',
                position: '',
            });
            generateStaffId(); // Generate new ID for next registration
            
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Registration error:', error);
            const message = error.response?.data || 'Failed to register user';
            toast.error(typeof message === 'string' ? message : JSON.stringify(message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Register New Staff Member</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Paul"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john.paul@company.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Temporary password will be generated and sent to this email</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Staff ID (Auto-generated)
                    </label>
                    <input
                        type="text"
                        value={generatedStaffId}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Staff ID is automatically generated</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                    </label>
                    <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Software Engineer"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Registering...' : 'Register Staff'}
                </button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The staff member will receive an email with their:
                </p>
                <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                    <li>Auto-generated Staff ID: <strong>{generatedStaffId}</strong></li>
                    <li>Temporary password (must be changed on first login)</li>
                    <li>Login instructions</li>
                </ul>
            </div>
        </div>
    );
};

export default RegisterUser;
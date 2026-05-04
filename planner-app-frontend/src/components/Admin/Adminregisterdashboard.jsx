import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';

const AdminRegisterDashboard = () => {
    const { user } = useAuth();
    const [mode, setMode] = useState('single'); // 'single' or 'bulk'
    const [loading, setLoading] = useState(false);

    // Single registration form state
    const [singleForm, setSingleForm] = useState({
        name: '',
        email: '',
        staffId: '',
        phoneNumber: '',
        position: '',
    });

    // Bulk registration state
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkPreview, setBulkPreview] = useState([]);
    const [bulkResults, setBulkResults] = useState(null);

    // Handle single form change
    const handleSingleChange = (e) => {
        const { name, value } = e.target;
        setSingleForm(prev => ({ ...prev, [name]: value }));
    };

    // Submit single registration
    const handleSingleSubmit = async (e) => {
        e.preventDefault();

        if (!singleForm.name || !singleForm.email || !singleForm.staffId) {
            toast.error('Name, email, and staff ID are required');
            return;
        }

        setLoading(true);
        try {
            const response = await adminAPI.registerUser(singleForm);
            toast.success('User registered successfully! Email sent.');
            setSingleForm({ name: '', email: '', staffId: '', phoneNumber: '', position: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Handle bulk file upload
    const handleBulkFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                const preview = [];

                lines.forEach((line, index) => {
                    const parts = line.split(',').map(p => p.trim());
                    if (parts.length >= 2) {
                        preview.push({
                            id: index,
                            name: parts[0],
                            email: parts[1],
                            staffId: parts[2] || '',
                            phoneNumber: parts[3] || '',
                            position: parts[4] || '',
                        });
                    }
                });

                setBulkFile(file);
                setBulkPreview(preview);
                toast.success(`Loaded ${preview.length} users from CSV`);
            } catch (error) {
                toast.error('Error parsing file. Please ensure it\'s a valid CSV.');
            }
        };
        reader.readAsText(file);
    };

    // Submit bulk registration
    const handleBulkSubmit = async () => {
        if (bulkPreview.length === 0) {
            toast.error('No users to register');
            return;
        }

        setLoading(true);
        try {
            const response = await adminAPI.registerUsersBulk(bulkPreview);
            setBulkResults(response.data);
            toast.success(`Registered ${response.data.successful.length} users!`);
            setBulkFile(null);
            setBulkPreview([]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Bulk registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <h1>User Registration Dashboard</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
                Logged in as: <strong>{user?.name}</strong>
            </p>

            {/* Mode Switcher */}
            <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => {
                        setMode('single');
                        setBulkResults(null);
                    }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: mode === 'single' ? 'var(--color-text-primary)' : 'var(--color-border-tertiary)',
                        color: mode === 'single' ? 'white' : 'var(--color-text-primary)',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                    }}
                >
                    Single Registration
                </button>
                <button
                    onClick={() => {
                        setMode('bulk');
                        setBulkResults(null);
                    }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: mode === 'bulk' ? 'var(--color-text-primary)' : 'var(--color-border-tertiary)',
                        color: mode === 'bulk' ? 'white' : 'var(--color-text-primary)',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                    }}
                >
                    Bulk Registration
                </button>
            </div>

            {/* Single Registration Form */}
            {mode === 'single' && (
                <form
                    onSubmit={handleSingleSubmit}
                    style={{
                        backgroundColor: 'var(--color-background-secondary)',
                        padding: '20px',
                        borderRadius: 'var(--border-radius-lg)',
                        border: `1px solid var(--color-border-tertiary)`,
                    }}
                >
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Full Name <span style={{ color: 'var(--color-text-danger)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={singleForm.name}
                            onChange={handleSingleChange}
                            placeholder="e.g., Ama Owusu"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: `1px solid var(--color-border-tertiary)`,
                                borderRadius: 'var(--border-radius-md)',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Email (Gmail) <span style={{ color: 'var(--color-text-danger)' }}>*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={singleForm.email}
                            onChange={handleSingleChange}
                            placeholder="e.g., ama.owusu@example.com"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: `1px solid var(--color-border-tertiary)`,
                                borderRadius: 'var(--border-radius-md)',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Staff ID <span style={{ color: 'var(--color-text-danger)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="staffId"
                            value={singleForm.staffId}
                            onChange={handleSingleChange}
                            placeholder="e.g., KNUST002"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: `1px solid var(--color-border-tertiary)`,
                                borderRadius: 'var(--border-radius-md)',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Phone Number (optional)
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={singleForm.phoneNumber}
                            onChange={handleSingleChange}
                            placeholder="e.g., +233 24 123 4567"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: `1px solid var(--color-border-tertiary)`,
                                borderRadius: 'var(--border-radius-md)',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                            Position (optional)
                        </label>
                        <input
                            type="text"
                            name="position"
                            value={singleForm.position}
                            onChange={handleSingleChange}
                            placeholder="e.g., Project Manager"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: `1px solid var(--color-border-tertiary)`,
                                borderRadius: 'var(--border-radius-md)',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: loading ? '#ccc' : 'var(--color-background-success)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--border-radius-md)',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Registering...' : 'Register User'}
                    </button>

                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
                        A temporary password will be generated and sent to their Gmail. They can change it after login.
                    </p>
                </form>
            )}

            {/* Bulk Registration Form */}
            {mode === 'bulk' && (
                <div>
                    {!bulkResults ? (
                        <div
                            style={{
                                backgroundColor: 'var(--color-background-secondary)',
                                padding: '20px',
                                borderRadius: 'var(--border-radius-lg)',
                                border: `1px solid var(--color-border-tertiary)`,
                            }}
                        >
                            <h3>Upload CSV File</h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                Format: Name, Email, Staff ID, Phone (optional), Position (optional)
                            </p>

                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleBulkFileChange}
                                style={{
                                    display: 'block',
                                    marginBottom: '15px',
                                    padding: '10px',
                                }}
                            />

                            {bulkPreview.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <h4>Preview ({bulkPreview.length} users)</h4>
                                    <div style={{
                                        overflowX: 'auto',
                                        border: `1px solid var(--color-border-tertiary)`,
                                        borderRadius: 'var(--border-radius-md)',
                                    }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: '13px',
                                        }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'var(--color-background-tertiary)' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid var(--color-border-tertiary)` }}>Name</th>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid var(--color-border-tertiary)` }}>Email</th>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid var(--color-border-tertiary)` }}>Staff ID</th>
                                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: `1px solid var(--color-border-tertiary)` }}>Position</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkPreview.slice(0, 5).map(user => (
                                                    <tr key={user.id}>
                                                        <td style={{ padding: '10px', borderBottom: `1px solid var(--color-border-tertiary)` }}>{user.name}</td>
                                                        <td style={{ padding: '10px', borderBottom: `1px solid var(--color-border-tertiary)` }}>{user.email}</td>
                                                        <td style={{ padding: '10px', borderBottom: `1px solid var(--color-border-tertiary)` }}>{user.staffId}</td>
                                                        <td style={{ padding: '10px', borderBottom: `1px solid var(--color-border-tertiary)` }}>{user.position || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {bulkPreview.length > 5 && (
                                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
                                            ... and {bulkPreview.length - 5} more
                                        </p>
                                    )}

                                    <button
                                        onClick={handleBulkSubmit}
                                        disabled={loading}
                                        style={{
                                            marginTop: '15px',
                                            padding: '12px 30px',
                                            backgroundColor: loading ? '#ccc' : 'var(--color-background-success)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 'var(--border-radius-md)',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {loading ? 'Processing...' : `Register ${bulkPreview.length} Users`}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: 'var(--color-background-secondary)',
                            padding: '20px',
                            borderRadius: 'var(--border-radius-lg)',
                        }}>
                            <h3>Registration Results</h3>

                            {bulkResults.successful.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: 'var(--color-text-success)' }}>
                                        ✓ Successful ({bulkResults.successful.length})
                                    </h4>
                                    <div style={{ fontSize: '13px' }}>
                                        {bulkResults.successful.map((result, idx) => (
                                            <div key={idx} style={{ padding: '8px', borderBottom: `1px solid var(--color-border-tertiary)` }}>
                                                {result.name} ({result.email})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {bulkResults.failed.length > 0 && (
                                <div>
                                    <h4 style={{ color: 'var(--color-text-danger)' }}>
                                        ✕ Failed ({bulkResults.failed.length})
                                    </h4>
                                    <div style={{ fontSize: '13px' }}>
                                        {bulkResults.failed.map((error, idx) => (
                                            <div key={idx} style={{ padding: '8px', borderBottom: `1px solid var(--color-border-tertiary)` }}>
                                                {error.email}: {error.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setBulkResults(null)}
                                style={{
                                    marginTop: '20px',
                                    padding: '10px 20px',
                                    backgroundColor: 'var(--color-text-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--border-radius-md)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                Register More Users
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminRegisterDashboard;
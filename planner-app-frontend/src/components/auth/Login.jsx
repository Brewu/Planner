import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ staffId: '', password: '' });
    const [errors, setErrors] = useState({});
    const [checkingStaffId, setCheckingStaffId] = useState(false);
    const [staffIdInfo, setStaffIdInfo] = useState(null);
    // Reset password modal state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetData, setResetData] = useState({
        staffId: '',
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [resetErrors, setResetErrors] = useState({});
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    // ===== LOGIN HANDLERS =====
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.staffId.trim())
            newErrors.staffId = 'Staff ID is required';
        if (!formData.password)
            newErrors.password = 'Password is required';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        const result = await login(formData.staffId.trim(), formData.password);
        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setErrors({ general: result.error });
        }
    };

    // ===== RESET PASSWORD HANDLERS =====
    const openResetModal = () => {
        setShowResetModal(true);
        setResetStep(1);
        setResetData({
            staffId: '',
            email: '',
            code: '',
            newPassword: '',
            confirmPassword: ''
        });
        setResetErrors({});
        setResetSuccess(false);
        setResetMessage('');
    };

    const closeResetModal = () => {
        setShowResetModal(false);
        setResetStep(1);
        setResetData({
            staffId: '',
            email: '',
            code: '',
            newPassword: '',
            confirmPassword: ''
        });
        setResetErrors({});
        setResetSuccess(false);
        setResetMessage('');
    };

    const handleResetChange = (e) => {
        const { name, value } = e.target;
        setResetData(prev => ({ ...prev, [name]: value }));
        if (resetErrors[name]) setResetErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateResetStep1 = () => {
        const newErrors = {};
        if (!resetData.staffId.trim()) newErrors.staffId = 'Staff ID is required';
        if (!resetData.email.trim()) newErrors.email = 'Email is required';
        if (resetData.email && !resetData.email.includes('@')) newErrors.email = 'Enter a valid email';
        return newErrors;
    };

    const validateResetStep3 = () => {
        const newErrors = {};
        if (!resetData.newPassword) newErrors.newPassword = 'Password is required';
        if (resetData.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
        if (resetData.newPassword !== resetData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        return newErrors;
    };
    const checkStaffId = async (staffId) => {
        if (!staffId.trim()) return;

        setCheckingStaffId(true);
        try {
            const response = await axios.get(`${API_URL}/Auth/check-staffid/${staffId.trim()}`);
            if (response.data.exists) {
                setStaffIdInfo(response.data);
                // Auto-fill the email if you want
                setResetData(prev => ({ ...prev, email: '' })); // Clear email so user must enter it
            } else {
                setStaffIdInfo(null);
                setResetErrors({ staffId: 'Staff ID not found in the system' });
            }
        } catch (error) {
            setStaffIdInfo(null);
            setResetErrors({ staffId: 'Staff ID not found' });
        } finally {
            setCheckingStaffId(false);
        }
    };
    const handleResetStep1 = async (e) => {
        e.preventDefault();
        const newErrors = validateResetStep1();
        if (Object.keys(newErrors).length > 0) {
            setResetErrors(newErrors);
            return;
        }

        setResetLoading(true);
        setResetMessage('');

        try {
            const response = await axios.post(`${API_URL}/Auth/forgot-password`, {
                staffId: resetData.staffId.trim(),
                email: resetData.email.trim()
            });

            if (response.status === 200) {
                setResetStep(2);
                setResetMessage('Verification code sent to your email. Please check your inbox.');
                setResetErrors({});
            }
        } catch (error) {
            console.error('Forgot password error:', error);

            // Handle specific error messages
            let errorMessage = 'Failed to send reset code. Please try again.';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid staff ID or email combination. Please check your credentials.';
            } else if (error.response?.status === 404) {
                errorMessage = 'No account found with these credentials.';
            }

            setResetErrors({
                general: errorMessage
            });
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetStep2 = async (e) => {
        e.preventDefault();
        if (!resetData.code.trim()) {
            setResetErrors({ code: 'Verification code is required' });
            return;
        }

        setResetLoading(true);
        setResetMessage('');

        try {
            const response = await axios.post(`${API_URL}/Auth/verify-reset-code`, {
                staffId: resetData.staffId.trim(),
                code: resetData.code.trim()
            });

            if (response.status === 200) {
                setResetStep(3);
                setResetErrors({});
            }
        } catch (error) {
            console.error('Verify code error:', error);
            setResetErrors({
                code: error.response?.data?.message || 'Invalid or expired verification code.'
            });
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetStep3 = async (e) => {
        e.preventDefault();
        const newErrors = validateResetStep3();
        if (Object.keys(newErrors).length > 0) {
            setResetErrors(newErrors);
            return;
        }

        setResetLoading(true);
        setResetMessage('');

        try {
            const response = await axios.post(`${API_URL}/Auth/reset-password`, {
                staffId: resetData.staffId.trim(),
                code: resetData.code.trim(),
                newPassword: resetData.newPassword
            });

            if (response.status === 200) {
                setResetSuccess(true);
                setResetMessage('Password reset successful! Redirecting to login...');
                setTimeout(() => {
                    closeResetModal();
                    // Optionally auto-fill staff ID in login form
                    setFormData(prev => ({ ...prev, staffId: resetData.staffId }));
                }, 2000);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setResetErrors({
                general: error.response?.data?.message || 'Failed to reset password. Please try again.'
            });
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full space-y-8">

                {/* Header with the KNUST image */}
                <div className="text-center">
                    {/* Added the KNUST photo with descriptive alt text and styling */}
                    <img 
                        src="/KNUST_idrDIuB-7S_2.jpeg" 
                        alt="KNUST Campus Landmark" 
                        className="mx-auto h-24 w-auto rounded-lg shadow-md object-cover"
                    />
                    <img src="/knust-logo.png" alt="" c                                                                                                                                                                       lassName="mx-auto h-16 w-auto mt-3" />
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                        KNUST Staff Portal
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Sign in with your KNUST Staff ID
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {errors.general && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                            {errors.general}
                        </div>
                    )}

                    <div>
                        <label htmlFor="staffId" className="block text-sm font-medium text-gray-700">
                            Staff ID
                        </label>
                        <input
                            id="staffId"
                            name="staffId"
                            type="text"
                            value={formData.staffId}
                            onChange={handleChange}
                            placeholder="e.g. ADMIN001 or STAFF001"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                                focus:outline-none focus:ring-green-500 focus:border-green-500
                                ${errors.staffId ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {errors.staffId && <p className="mt-1 text-sm text-red-600">{errors.staffId}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                                focus:outline-none focus:ring-green-500 focus:border-green-500
                                ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent
                            rounded-md shadow-sm text-sm font-medium text-white
                            bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2
                            focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {loading ? <LoadingSpinner /> : 'Sign in'}
                    </button>
                </form>

                {/* Forgot Password Link */}
                <div className="text-center">
                    <button
                        type="button"
                        onClick={openResetModal}
                        className="text-sm font-medium text-green-700 hover:text-green-800 underline"
                    >
                        Forgot your password?
                    </button>
                </div>

                <p className="text-center text-xs text-gray-400">
                    Access restricted to authorised KNUST staff only.
                </p>
            </div>

            {/* RESET PASSWORD MODAL */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 space-y-6 relative">

                        {/* Close Button */}
                        <button
                            onClick={closeResetModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Message Display */}
                        {resetMessage && (
                            <div className={`rounded-md p-3 text-sm ${resetSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                {resetMessage}
                            </div>
                        )}

                        {/* Error Display */}
                        {resetErrors.general && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                                {resetErrors.general}
                            </div>
                        )}

                        {/* Success State */}
                        {resetSuccess ? (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Password Reset Successful</h3>
                                <p className="text-sm text-gray-600">Your password has been updated. You can now sign in with your new password.</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Reset Your Password</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {resetStep === 1 && "Enter your Staff ID and email address to get started."}
                                        {resetStep === 2 && "We've sent a verification code to your email."}
                                        {resetStep === 3 && "Create a new password for your account."}
                                    </p>
                                </div>

                                {/* Progress Indicator */}
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(step => (
                                        <div
                                            key={step}
                                            className={`flex-1 h-1 rounded-full transition-colors ${step <= resetStep ? 'bg-green-700' : 'bg-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Step 1: Email & Staff ID */}
                                {resetStep === 1 && (
                                    <form onSubmit={handleResetStep1} className="space-y-4">
                                        <div>
                                            <label htmlFor="reset-staffId" className="block text-sm font-medium text-gray-700">
                                                Staff ID
                                            </label>
                                            <input
                                                id="reset-staffId"
                                                name="staffId"
                                                type="text"
                                                value={resetData.staffId}
                                                onChange={handleResetChange}
                                                placeholder="e.g. ADMIN001"
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                                                    focus:outline-none focus:ring-green-500 focus:border-green-500
                                                    ${resetErrors.staffId ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {resetErrors.staffId && <p className="mt-1 text-sm text-red-600">{resetErrors.staffId}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                                                Email Address
                                            </label>
                                            <input
                                                id="reset-email"
                                                name="email"
                                                type="email"
                                                value={resetData.email}
                                                onChange={handleResetChange}
                                                placeholder="your.email@knust.edu.gh"
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                                                    focus:outline-none focus:ring-green-500 focus:border-green-500
                                                    ${resetErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {resetErrors.email && <p className="mt-1 text-sm text-red-600">{resetErrors.email}</p>}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                                                bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                                disabled:opacity-50 transition-colors"
                                        >
                                            {resetLoading ? 'Sending...' : 'Send Verification Code'}
                                        </button>
                                    </form>
                                )}

                                {/* Step 2: Verification Code */}
                                {resetStep === 2 && (
                                    <form onSubmit={handleResetStep2} className="space-y-4">
                                        <div>
                                            <label htmlFor="reset-code" className="block text-sm font-medium text-gray-700">
                                                Verification Code
                                            </label>
                                            <input
                                                id="reset-code"
                                                name="code"
                                                type="text"
                                                value={resetData.code}
                                                onChange={handleResetChange}
                                                placeholder="000000"
                                                maxLength={6}
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm text-center tracking-widest
                                                    focus:outline-none focus:ring-green-500 focus:border-green-500
                                                    ${resetErrors.code ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {resetErrors.code && <p className="mt-1 text-sm text-red-600">{resetErrors.code}</p>}
                                        </div>

                                        <p className="text-xs text-gray-500 text-center">
                                            Didn't receive the code? Check your spam folder or request a new one.
                                        </p>

                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                                                bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                                disabled:opacity-50 transition-colors"
                                        >
                                            {resetLoading ? 'Verifying...' : 'Verify Code'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setResetStep(1)}
                                            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700
                                                bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                                transition-colors"
                                        >
                                            Back
                                        </button>
                                    </form>
                                )}

                                {/* Step 3: New Password */}
                                {resetStep === 3 && (
                                    <form onSubmit={handleResetStep3} className="space-y-4">
                                        <div>
                                            <label htmlFor="reset-newPassword" className="block text-sm font-medium text-gray-700">
                                                New Password
                                            </label>
                                            <input
                                                id="reset-newPassword"
                                                name="newPassword"
                                                type="password"
                                                value={resetData.newPassword}
                                                onChange={handleResetChange}
                                                placeholder="At least 6 characters"
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                                                    focus:outline-none focus:ring-green-500 focus:border-green-500
                                                    ${resetErrors.newPassword ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {resetErrors.newPassword && <p className="mt-1 text-sm text-red-600">{resetErrors.newPassword}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="reset-confirmPassword" className="block text-sm font-medium text-gray-700">
                                                Confirm Password
                                            </label>
                                            <input
                                                id="reset-confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                value={resetData.confirmPassword}
                                                onChange={handleResetChange}
                                                placeholder="Re-enter your password"
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                                                    focus:outline-none focus:ring-green-500 focus:border-green-500
                                                    ${resetErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {resetErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{resetErrors.confirmPassword}</p>}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                                                bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                                disabled:opacity-50 transition-colors"
                                        >
                                            {resetLoading ? 'Resetting...' : 'Reset Password'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setResetStep(2)}
                                            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700
                                                bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                                transition-colors"
                                        >
                                            Back
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
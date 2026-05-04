import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim())
            newErrors.name = 'Full name is required';

        if (!formData.email.trim()) {
            newErrors.email = 'KNUST email is required';
        } else if (
            !formData.email.endsWith('@knust.edu.gh') &&
            !formData.email.endsWith('@st.knust.edu.gh')
        ) {
            newErrors.email = 'Only @knust.edu.gh or @st.knust.edu.gh emails are allowed';
        }

        if (!formData.password)
            newErrors.password = 'Password is required';
        else if (formData.password.length < 6)
            newErrors.password = 'Password must be at least 6 characters';

        if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = 'Passwords do not match';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setLoading(true);
        const result = await register({
            name: formData.name.trim(),
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
            ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
        });
        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else if (typeof result.error === 'string') {
            setErrors({ general: result.error });
        }
    };

    const field = (id, label, type = 'text', placeholder = '') => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <input
                id={id} name={id} type={type}
                value={formData[id]}
                onChange={handleChange}
                placeholder={placeholder}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                    focus:outline-none focus:ring-green-500 focus:border-green-500
                    ${errors[id] ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors[id] && <p className="mt-1 text-sm text-red-600">{errors[id]}</p>}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">

                {/* Header */}
                <div className="text-center">
                    <img src="/knust-logo.png" alt="KNUST" className="mx-auto h-16 w-auto" />
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already registered?{' '}
                        <Link to="/login" className="font-medium text-green-700 hover:text-green-600">
                            Sign in here
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {errors.general && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                            {errors.general}
                        </div>
                    )}

                    {field('name', 'Full Name', 'text', 'e.g. Kwame Mensah')}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            KNUST Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="email" name="email" type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@knust.edu.gh"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm
                                focus:outline-none focus:ring-green-500 focus:border-green-500
                                ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            Staff: @knust.edu.gh · Students: @st.knust.edu.gh
                        </p>
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    {field('phoneNumber', 'Phone Number (optional)', 'tel', '024XXXXXXX')}
                    {field('password', 'Password', 'password', 'At least 6 characters')}
                    {field('confirmPassword', 'Confirm Password', 'password', 'Re-enter your password')}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent
                            rounded-md shadow-sm text-sm font-medium text-white
                            bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2
                            focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <LoadingSpinner /> : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400">
                    Only staff and students with a valid KNUST email may register.
                </p>
            </div>
        </div>
    );
};

export default Register;
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
    return password.length >= 6;
};

export const validateRegisterForm = (formData) => {
    const errors = {};

    if (!formData.name?.trim()) {
        errors.name = 'Name is required';
    }

    if (!formData.email && !formData.phoneNumber) {
        errors.contact = 'Either email or phone number is required';
    }

    if (formData.email && !validateEmail(formData.email)) {
        errors.email = 'Invalid email format';
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
        errors.phoneNumber = 'Invalid phone number format';
    }

    if (formData.password && !validatePassword(formData.password)) {
        errors.password = 'Password must be at least 6 characters';
    }

    return errors;
};
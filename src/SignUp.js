import { useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: "https://mernwebmanga.onrender.com"
});

function SignUp({ setMode }) {

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [company, setCompany] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // ===== VALIDATIONS =====

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validatePassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        return regex.test(password);
    };

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[@$!%*?&]/.test(pwd)) strength++;

        const levels = [
            { label: 'Very Weak', color: '#ff4444' },
            { label: 'Weak', color: '#ff8800' },
            { label: 'Fair', color: '#ffbb00' },
            { label: 'Good', color: '#88cc00' },
            { label: 'Strong', color: '#00cc44' },
            { label: 'Very Strong', color: '#00aa00' }
        ];

        return {
            strength,
            ...levels[Math.min(strength, 5)]
        };
    };

    const validateForm = () => {
        const errors = {};

        if (!username || username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!email || !validateEmail(email)) {
            errors.email = 'Invalid email';
        }

        if (!password || !validatePassword(password)) {
            errors.password = 'Weak password (8+ chars, upper, lower, number, symbol)';
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!company) {
            errors.company = 'Select a company';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== SIGNUP FUNCTION =====
    const handleSignup = async () => {

        setError('');

        if (!validateForm()) {
            setError('Fix the errors above');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/api/signup", {
                name: username.trim(),
                email: email.trim().toLowerCase(),
                password: password.trim(),
                company
            });

            if (res.data.success) {
                alert("✅ Account created successfully");
                setMode('login');
            } else {
                setError("Signup failed");
            }

        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(password);

    // ===== UI =====
    return (
        <div className="auth-container">
            <div className="auth-card signup-card">

                <h1>Create Account</h1>

                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* USERNAME */}
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {/* EMAIL */}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* PASSWORD */}
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* PASSWORD STRENGTH */}
                {password && (
                    <p style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                    </p>
                )}

                <button onClick={() => setShowPassword(!showPassword)}>
                    Toggle Password
                </button>

                {/* CONFIRM PASSWORD */}
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    Toggle Confirm
                </button>

                {/* COMPANY */}
                <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                >
                    <option value="">Select Company</option>
                    <option>Google</option>
                    <option>Microsoft</option>
                    <option>Apple</option>
                    <option>OpenAI</option>
                </select>

                {/* BUTTON */}
                <button onClick={handleSignup} disabled={loading}>
                    {loading ? "Creating..." : "Sign Up"}
                </button>

                <p onClick={() => setMode('login')}>
                    Already have an account? Login
                </p>

            </div>
        </div>
    );
}

export default SignUp;

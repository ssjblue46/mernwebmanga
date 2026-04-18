import { useState } from 'react';
import axios from 'axios';
import "./App.css";

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

    <div className="auth-header">
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-subtitle">Join MangaVerse 🚀</p>
    </div>

    {/* ERROR */}
    {error && <div className="error-message">{error}</div>}

    <div className="auth-form">

      {/* USERNAME */}
      <div className="input-group">
        <label>Username</label>
        <input
          className={`auth-input ${validationErrors.username ? "error" : ""}`}
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {validationErrors.username && (
          <span className="field-error">{validationErrors.username}</span>
        )}
      </div>

      {/* EMAIL */}
      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          className={`auth-input ${validationErrors.email ? "error" : ""}`}
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {validationErrors.email && (
          <span className="field-error">{validationErrors.email}</span>
        )}
      </div>

      {/* PASSWORD */}
      <div className="input-group">
        <label>Password</label>

        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            className={`auth-input ${validationErrors.password ? "error" : ""}`}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            👁️
          </button>
        </div>

        {/* STRENGTH BAR */}
        {password && (
          <div className="password-strength">
            <div className="strength-bar">
              <div
                className="strength-fill"
                style={{
                  width: `${(passwordStrength.strength / 5) * 100}%`,
                  background: passwordStrength.color
                }}
              />
            </div>
            <span
              className="strength-label"
              style={{ color: passwordStrength.color }}
            >
              {passwordStrength.label}
            </span>
          </div>
        )}

        {validationErrors.password && (
          <span className="field-error">{validationErrors.password}</span>
        )}
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="input-group">
        <label>Confirm Password</label>

        <div className="password-input-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className={`auth-input ${validationErrors.confirmPassword ? "error" : ""}`}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            👁️
          </button>
        </div>

        {validationErrors.confirmPassword && (
          <span className="field-error">{validationErrors.confirmPassword}</span>
        )}
      </div>

      {/* COMPANY */}
      <div className="input-group">
        <label>Company</label>
        <select
          className={`auth-select ${validationErrors.company ? "error" : ""}`}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        >
          <option value="">Select Company</option>
          <option>Google</option>
          <option>Microsoft</option>
          <option>Apple</option>
          <option>OpenAI</option>
        </select>

        {validationErrors.company && (
          <span className="field-error">{validationErrors.company}</span>
        )}
      </div>

      {/* BUTTON */}
      <button
        className="auth-button primary"
        onClick={handleSignup}
        disabled={loading}
      >
        {loading ? <div className="spinner"></div> : "Create Account"}
      </button>

    </div>

    {/* FOOTER */}
    <div className="auth-footer">
      <p>
        Already have an account?{" "}
        <span className="auth-link" onClick={() => setMode('login')}>
          Login
        </span>
      </p>
    </div>

  </div>
</div>
    );
}

export default SignUp;

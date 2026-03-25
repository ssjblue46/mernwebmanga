import { useState } from "react";
import axios from "axios";

// ✅ Using your Live Render URL
const API_BASE_URL = "https://onrender.com";

function LoginPage({ setLoggedIn, setUserRole, setUserEmail }) {
  const [selectedRole, setSelectedRole] = useState("reader");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Default Admin credentials
  const ADMIN_EMAIL = "rajmt2005@gmail.com";
  const ADMIN_PASSWORD = "Raj@101105";

  // Helper: Save token + role
  const saveLogin = (role, email = "", token = `local-token-${Date.now()}`) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", email);
    setUserRole(role);
    setUserEmail(email);
    setLoggedIn(true);
  };

  // Login handler for Admin & Creator
  const handleAuthLogin = async () => {
    setError("");
    if (!email || !password) {
      setError(`Please enter ${selectedRole} email and password`);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
        role: selectedRole
      });

      // Direct login if successful
      if (res.data.token) {
        saveLogin(selectedRole, email, res.data.token);
      } else if (res.data.message === "Login successful" || res.status === 200) {
        // Fallback for different API response styles
        saveLogin(selectedRole, email);
      } else {
        setError("Login failed. Please check credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || `${selectedRole} login failed. Check connection.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError("");
    if (role === "admin") {
      setEmail(ADMIN_EMAIL);
      setPassword(ADMIN_PASSWORD);
    } else if (role === "reader") {
      saveLogin("reader", "Guest Reader");
    } else {
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card login-card">
        <div className="auth-header">
          <div className="avatar-container">
            <img src="/user.png" alt="profile pic" className="auth-avatar" />
          </div>
          <h1 className="auth-title">Welcome to MangaVerse</h1>
          <p className="auth-subtitle">Sign in to continue</p>
        </div>

        {/* Role Selection */}
        <div className="role-selector">
          <button
            onClick={() => handleRoleChange("admin")}
            className={`role-btn ${selectedRole === "admin" ? "active" : ""}`}
          >
            <span className="role-icon">👑</span> Admin
          </button>
          <button
            onClick={() => handleRoleChange("creator")}
            className={`role-btn ${selectedRole === "creator" ? "active" : ""}`}
          >
            <span className="role-icon">✍️</span> Creator
          </button>
          <button
            onClick={() => handleRoleChange("reader")}
            className={`role-btn ${selectedRole === "reader" ? "active" : ""}`}
          >
            <span className="role-icon">📖</span> Reader
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        )}

        {/* Login Form for Admin & Creator */}
        {(selectedRole === "admin" || selectedRole === "creator") && (
          <div className="auth-form">
            <div className="input-group">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder={`Enter ${selectedRole} email`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label htmlFor="auth-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={`Enter ${selectedRole} password`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            <button
              className="auth-button primary"
              onClick={handleAuthLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Logging in...
                </>
              ) : (
                `${selectedRole === 'admin' ? 'Admin' : 'Creator'} Login`
              )}
            </button>
          </div>
        )}

        {/* Reader Info */}
        {selectedRole === "reader" && (
          <div className="reader-info">
            <div className="info-card">
              <span className="info-icon">📚</span>
              <p>Entering the library as a Guest...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;

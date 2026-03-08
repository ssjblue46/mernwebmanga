// (LoginPage.js)
import { useState } from "react";
import axios from "axios";

function LoginPage({ setMode, setLoggedIn, setUserRole, setUserEmail }) {
  const [selectedRole, setSelectedRole] = useState("reader");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Default Admin credentials (created by server)
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

  // Quick login for reader (no credentials)
  const quickRoleLogin = (role) => {
    saveLogin(role);
  };

  // Admin login (requires OTP + email/password)
  const handleAdminLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter admin email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
        role: "admin"
      });

      if (res.data.message === "OTP required") {
        localStorage.setItem("pendingLoginRole", "admin");
        localStorage.setItem("pendingLoginEmail", email);
        
        await axios.post("http://localhost:5000/send-otp", { email });
        setMode("otp");
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  // Creator login (email/password only, no OTP)
  const handleCreatorLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
        role: "creator"
      });

      if (res.data.token) {
        saveLogin("creator", email, res.data.token);
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Creator login failed");
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
    } else {
      setEmail("");
      setPassword("");
    }
    if (role === "reader") {
      quickRoleLogin("reader");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card login-card">
        <div className="auth-header">
          <div className="avatar-container">
            <img
              src="/user.png"
              alt="profile pic"
              className="auth-avatar"
            />
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
            <span className="role-icon">👑</span>
            Admin
          </button>
          <button
            onClick={() => handleRoleChange("creator")}
            className={`role-btn ${selectedRole === "creator" ? "active" : ""}`}
          >
            <span className="role-icon">✍️</span>
            Creator
          </button>
          <button
            onClick={() => handleRoleChange("reader")}
            className={`role-btn ${selectedRole === "reader" ? "active" : ""}`}
          >
            <span className="role-icon">📖</span>
            Reader
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Admin Login Form */}
        {selectedRole === "admin" && (
          <div className="auth-form">
            <div className="input-group">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label htmlFor="admin-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
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
              onClick={handleAdminLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                "Admin Login"
              )}
            </button>
          </div>
        )}

        {/* Creator Login Form */}
        {selectedRole === "creator" && (
          <div className="auth-form">
            <div className="input-group">
              <label htmlFor="creator-email">Email</label>
              <input
                id="creator-email"
                type="email"
                placeholder="Enter creator email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label htmlFor="creator-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="creator-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter creator password"
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
              onClick={handleCreatorLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                "Creator Login"
              )}
            </button>
          </div>
        )}

        {/* Reader Info */}
        {selectedRole === "reader" && (
          <div className="reader-info">
            <div className="info-card">
              <span className="info-icon">📚</span>
              <h3>Reader Access</h3>
              <p>You can view all comics freely without any restrictions.</p>
              <p className="info-note">You're already logged in as a Reader!</p>
            </div>
          </div>
        )}

        {/* Sign Up Link */}
        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <span
              className="auth-link"
              onClick={() => setMode("signup")}
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
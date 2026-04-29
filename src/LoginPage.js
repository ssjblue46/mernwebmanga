import { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mernwebmanga.onrender.com"
});

function LoginPage({ setMode, setLoggedIn, setUserRole, setUserEmail }) {

  const [selectedRole, setSelectedRole] = useState("reader");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Save login properly
const saveLogin = (role, email, token, id) => {
  localStorage.setItem("userToken", token);
  localStorage.setItem("userRole", role);
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userId", id); // ✅ IMPORTANT

  setUserRole(role);
  setUserEmail(email);
  setLoggedIn(true);
};

  // ✅ MAIN LOGIN (for admin + creator)
  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/login", {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (res.data.success) {

        const user = res.data.user;
        const token = res.data.token;

        // 🔥 role comes from backend
        saveLogin(user.role, user.email, token, user.id);

      } else {
        setError("Login failed");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Reader = no login needed
  const quickReaderLogin = () => {
    saveLogin("reader", "guest", `guest-${Date.now()}`);
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError("");
    setEmail("");
    setPassword("");

    if (role === "reader") {
      quickReaderLogin();
    }
  };

  return (
    <div className="auth-card login-card">
    <div className="auth-header">

    <div className="avatar-container">
      <img
        src="/user.png"
        alt="logo"
        className="auth-avatar"
      />
    </div>
  <h1 className="auth-title">Welcome to MangaVerse</h1>
          </div>
  {/* ROLE SELECT */}
  <div className="role-selector">
    <button
      className={`role-btn ${selectedRole === "admin" ? "active" : ""}`}
      onClick={() => handleRoleChange("admin")}
    >
      👑 <span>Admin</span>
    </button>

    <button
      className={`role-btn ${selectedRole === "creator" ? "active" : ""}`}
      onClick={() => handleRoleChange("creator")}
    >
      ✍️ <span>Creator</span>
    </button>

    <button
      className={`role-btn ${selectedRole === "reader" ? "active" : ""}`}
      onClick={() => handleRoleChange("reader")}
    >
      📖 <span>Reader</span>
    </button>
  </div>

  {/* ERROR */}
  {error && <div className="error-message">{error}</div>}

  {/* LOGIN FORM */}
  {(selectedRole === "admin" || selectedRole === "creator") && (
    <div className="auth-form">

      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          className="auth-input"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Password</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            className="auth-input"
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
      </div>

      <button
        className="auth-button primary"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? <div className="spinner"></div> : "Login"}
      </button>

    </div>
  )}

  {/* READER */}
  {selectedRole === "reader" && (
    <div className="reader-info">
      <div className="info-card">
        <span className="info-icon">📖</span>
        <h3>Reader Mode</h3>
        <p>You can explore manga without logging in.</p>
      </div>
    </div>
  )}

  <div className="auth-footer">
    <p>
      Don't have an account?{" "}
      <span className="auth-link" onClick={() => setMode("signup")}>
        Sign Up
      </span>
    </p>
  </div>

</div>
  );
}

export default LoginPage;

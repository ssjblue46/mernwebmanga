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
  const saveLogin = (role, email, token) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", email);

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
        saveLogin(user.role, user.email, token);

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
    <div className="auth-container">
      <div className="auth-card login-card">

        <h1>Welcome to MangaVerse</h1>

        {/* ROLE SELECT */}
        <div className="role-selector">
          <button onClick={() => handleRoleChange("admin")}>
            👑 Admin
          </button>
          <button onClick={() => handleRoleChange("creator")}>
            ✍️ Creator
          </button>
          <button onClick={() => handleRoleChange("reader")}>
            📖 Reader
          </button>
        </div>

        {/* ERROR */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* LOGIN FORM */}
        {(selectedRole === "admin" || selectedRole === "creator") && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        )}

        {/* READER */}
        {selectedRole === "reader" && (
          <p>You are logged in as Reader</p>
        )}

        <p onClick={() => setMode("signup")}>
          Don't have an account? Sign Up
        </p>

      </div>
    </div>
  );
}

export default LoginPage;

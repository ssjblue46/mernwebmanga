import { useState } from "react";
import axios from "axios";


const api = axios.create({
  baseURL: "https://mernwebmanga.onrender.com",
  headers: {
    "Content-Type": "application/json"
  }
});

function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      const res = await api.post("/api/login", {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (res.data.success) {
        alert("Login successful");
      }

    } catch (err) {
      const data = err.response?.data;
      alert(data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="floating-card">

        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Login to continue</p>

        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />

        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />

        <button
          type="button"
          className="button"
          onClick={handleLogin}
        >
          Login
        </button>

      </div>
    </div>
  );
}

export default LoginPage;

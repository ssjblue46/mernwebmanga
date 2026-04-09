import { useState } from 'react'
import axios from 'axios'

function SignUp({ setMode }) {

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
    return regex.test(password)
  }

  const handleSignup = async () => {

    if (!name || !email || !password || !confirmPassword || !company) {
      alert("All fields are required")
      return
    }

    if (!validateEmail(email)) {
      alert("Enter valid email")
      return
    }

    if (!validatePassword(password)) {
      alert("Password must be strong (8+ chars, uppercase, lowercase, number, special char)")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    if (loading) return
    setLoading(true)

    try {

      const res = await axios.post("/api/signup", {
        name,
        email: email.trim().toLowerCase(),
        password,
        company
      })

      alert(res.data.message || "Account created successfully")
      setMode("login")

    } catch (err) {

      alert(err.response?.data?.message || "Signup failed")

    }

    setLoading(false)
  }

  return (
    <div className="Signup-card">

      <div className="signup">

        <h2>Create Account</h2>

        <input
          className="sinput"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="sinput"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="sinput"
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <input
          className="sinput"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="sinput"
          placeholder="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          className="sgbutton"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p>
          Already have an account?
          <span onClick={() => setMode("login")}> Login</span>
        </p>

      </div>
    </div>
  )
}

export default SignUp

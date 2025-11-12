import React, { useState, useContext } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/common/ErrorMessage";
import "../styles/SignupForm.css";

export default function SignupForm() {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long");
      return;
    }
    setLocalError("");

    const ok = await signup(username, email, password);
    if (ok) navigate("/login");
  };

  return (
    <>
      <Navbar />
      <div className="signup-wrapper">
        <h2 className="signup-title">Sign Up</h2>

        <form className="signup-form" onSubmit={handleSubmit}>
          <label className="input-label">Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter Your Username"
            className="input-field"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setLocalError(""); clearError?.(); }}
            required
            autoComplete="username"
          />

          <label className="input-label">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter Your Email"
            className="input-field"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setLocalError(""); clearError?.(); }}
            required
            autoComplete="email"
          />

          <label className="input-label">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter Your Password"
            className="input-field"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLocalError(""); clearError?.(); }}
            required
            autoComplete="new-password"
            aria-invalid={!!localError}
          />

          {localError && <ErrorMessage message={localError} />}
          {error && <ErrorMessage message={error} />}

          <p className="login-text">
            Already have an account?{" "}
            <Link to="/login" className="login-link">Login here.</Link>
          </p>

          <button type="submit" className="btn-continue" disabled={loading}>
            {loading ? "Signing up..." : "Continue"}
          </button>
        </form>
      </div>
    </>
  );
}

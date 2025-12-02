import React, { useState, useContext } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/common/ErrorMessage";
import "../styles/LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate("/preferences");
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <h2 className="login-title">Login</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-label">Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter Your Username"
            className="input-field"
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearError?.(); }}
            required
            autoComplete="username"
          />

          <label className="input-label">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter Your Password"
            className="input-field"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError?.(); }}
            required
            autoComplete="current-password"
          />

          {error && <ErrorMessage message={error} />}

          <p className="signup-text">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="signup-link"
              onClick={() => clearError?.()}
            >
              Create one here.
            </Link>
          </p>

          <button type="submit" className="btn-continue" disabled={loading}>
            {loading ? "Logging in..." : "Continue"}
          </button>
        </form>
      </div>
    </>
  );
}

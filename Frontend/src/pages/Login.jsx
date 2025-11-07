// pages/Login.jsx
import React, { useState } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LoginForm.css";
import { useAuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, authError } = useAuthContext();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.username.trim()) return "Please enter your username.";
    if (!form.password || form.password.length < 8)
      return "Password must be at least 8 characters long.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    const res = await login(form.username.trim(), form.password);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    navigate("/preferences");
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <h2 className="login-title">Login Account</h2>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="input-label">Username</label>
          <input
            name="username"
            type="text"
            placeholder="Enter your username"
            className={`input-field ${error || authError ? "error" : ""}`}
            value={form.username}
            onChange={onChange}
            autoComplete="username"
          />

          <label className="input-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            className={`input-field ${error || authError ? "error" : ""}`}
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
          />

          {(error || authError) && (
            <p className="error-text">{error || authError}</p>
          )}

          <p className="signup-text">
            Don’t have an account?{" "}
            <Link to="/signup" className="signup-link">
              Create one here.
            </Link>
          </p>

          <button type="submit" className="btn-continue">Continue</button>
        </form>
      </div>
    </>
  );
}

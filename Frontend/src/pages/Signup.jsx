import React, { useState } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import "../styles/SignupForm.css";
import { authAPI } from "../services/authAPI";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.username.trim()) return "Please enter your username.";
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!okEmail) return "Please enter a valid email address.";
    if (!form.password || form.password.length < 8)
      return "Password must be at least 8 characters long.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) { setError(v); return; }

    const res = await authAPI.register(
      form.username.trim(),
      form.email.trim(),
      form.password
    );

    if (!res.ok) {
      setError(res.error);   // <- luôn là string (nhờ toErrorMessage)
      return;
    }

    navigate("/login");
  };

  return (
    <>
      <Navbar />
      <div className="signup-wrapper">
        <h2 className="signup-title">Sign Up</h2>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <label className="input-label">Username</label>
          <input
            name="username"
            type="text"
            placeholder="Enter your username"
            className={`input-field ${error ? "error" : ""}`}
            value={form.username}
            onChange={onChange}
            required
            autoComplete="username"
          />

          <label className="input-label">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            className={`input-field ${error ? "error" : ""}`}
            value={form.email}
            onChange={onChange}
            required
            autoComplete="email"
          />

          <label className="input-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            className={`input-field ${error ? "error" : ""}`}
            value={form.password}
            onChange={onChange}
            minLength={8}
            required
            autoComplete="new-password"
          />

          {error && <p className="error-text">{error}</p>}

          <p className="login-text">
            Already have an account?{" "}
            <Link to="/login" className="login-link">Login here.</Link>
          </p>

          <button type="submit" className="btn-continue">Continue</button>
        </form>
      </div>
    </>
  );
}

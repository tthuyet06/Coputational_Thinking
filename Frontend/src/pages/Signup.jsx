import React, { useState } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import "../styles/SignupForm.css";

export default function SignupForm() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Gọi API signup từ authApi
      const response = await authApi.signup({ username, email, password });

      console.log("✅ Signup success:", response.data);

      // Redirect sang login page
      navigate("/login");
    } catch (err) {
      console.error("❌ Signup failed:", err);
      // Hiển thị thông báo lỗi từ backend hoặc mặc định
      setError(err.response?.data?.message || "Signup failed");
    }
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
            placeholder="Enter Your Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label className="input-label">Email</label>
          <input
            type="email"
            placeholder="Enter Your Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="input-label">Password</label>
          <input
            type="password"
            placeholder="Enter Your Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}

          <p className="login-text">
            If you already have an account.{" "}
            <Link to="/login" className="login-link">
              Login here.
            </Link>
          </p>

          <button type="submit" className="btn-continue">
            Continue
          </button>
        </form>
      </div>
    </>
  );
}

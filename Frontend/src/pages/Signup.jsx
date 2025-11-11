import React, { useState, useContext } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/common/ErrorMessage";
import "../styles/SignupForm.css";

export default function SignupForm() {
  const navigate = useNavigate();
  const { signup, loading, error } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signup(username, email, password);

      // Nếu signup thành công (token tồn tại trong localStorage)
      const token = localStorage.getItem("token");
      if (token) {
        navigate("/login");
      }
    } catch (err) {
      // error đã được set trong AuthContext, chỉ cần render
      console.log("Signup error:", err);
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
            name="username"
            placeholder="Enter Your Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {/* Hiển thị lỗi nếu có */}
          {error && <ErrorMessage message={error} />}

          <p className="login-text">
            If you already have an account.{" "}
            <Link to="/login" className="login-link">
              Login here.
            </Link>
          </p>

          <button type="submit" className="btn-continue" disabled={loading}>
            {loading ? "Signing up..." : "Continue"}
          </button>
        </form>
      </div>
    </>
  );
}
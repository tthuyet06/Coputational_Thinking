import React, { useState, useContext } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ErrorMessage from "../components/common/ErrorMessage";
import "../styles/LoginForm.css";
import { useAuthContext } from "../context/AuthContext";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, loading, error } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    await login(username, password);

    // Nếu login thành công (user tồn tại trong context)
    const token = localStorage.getItem("token"); // AuthContext lưu token
    if (token) {
      navigate("/preferences");
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <h2 className="login-title">Login Account</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-label">Username</label>
          <input
            name="username"
            type="text"
            placeholder="Enter Your Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="input-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter Your Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="btn-continue" disabled={loading}>
            {loading ? "Logging in..." : "Continue"}
          </button>

          {/* Hiển thị lỗi nếu có */}
          <ErrorMessage message={error} />
        </form>
      </div>
    </>
  );
}

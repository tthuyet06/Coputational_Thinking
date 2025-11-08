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

    // 1. Gọi signup và nhận kết quả true/false
    const isSignedUp = await signup(username, email, password);

    // 2. Kiểm tra kết quả
    if (isSignedUp) {
      // 3. Đã đăng ký VÀ tự động đăng nhập thành công
      //    Điều hướng vào app (giống như Login)
      navigate("/preferences");
    }

    // 4. Không cần khối try...catch hoặc kiểm tra token.
    // Nếu isSignedUp là false, AuthContext đã tự set 'error'
    // và <ErrorMessage> sẽ hiển thị nó.
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

import React from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom"; // ✅ thêm useNavigate
import "../styles/LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate(); // ✅ khai báo hook điều hướng

  const handleSubmit = (e) => {
    e.preventDefault();

    // (Tạm thời giả lập login thành công)
    console.log("✅ Login success!");

    // ✅ điều hướng sang trang Preferences
    navigate("/preferences");
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        <h2 className="login-title">Login Account</h2>

        {/* ✅ thêm onSubmit={handleSubmit} để kích hoạt điều hướng */}
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-label">Username</label>
          <input
            type="text"
            placeholder="Enter Your Username"
            className="input-field"
          />

          <label className="input-label">Password</label>
          <input
            type="password"
            placeholder="Enter Your Password"
            className="input-field"
          />

          <p className="signup-text">
            If you don’t have an account yet.{" "}
            <Link to="/signup" className="signup-link">
              Create one here.
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

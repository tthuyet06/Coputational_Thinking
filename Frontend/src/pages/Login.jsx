import React, { useState } from "react";
import Navbar from "../components/layouts/Navbar";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import "../styles/LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await authApi.login({ username, password });
      localStorage.setItem("accessToken", response.data.access_token);
      console.log("Login success!", response.data);
      navigate("/preferences");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed! Please check your username and password.");
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
            type="text"
            placeholder="Enter Your Username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label className="input-label">Password</label>
          <input
            type="password"
            placeholder="Enter Your Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

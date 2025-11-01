import React from "react";
import { Link } from "react-router-dom";
import "../styles/SignupForm.css";
import Navbar from "../components/layouts/Navbar";

export default function SignupForm() {
  return (
    <>
      <Navbar />
      <div className="signup-wrapper">
        <h2 className="signup-title">Sign Up</h2>

        <form className="signup-form">
          <label className="input-label">Username</label>
          <input
            type="text"
            placeholder="Enter Your Username"
            className="input-field"
          />

          <label className="input-label">Email</label>
          <input
            type="email"
            placeholder="Enter Your Email"
            className="input-field"
          />

          <label className="input-label">Password</label>
          <input
            type="password"
            placeholder="Enter Your Password"
            className="input-field"
          />

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

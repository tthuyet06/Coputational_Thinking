import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login.jsx";
import RegisterPage from "./pages/Register.jsx";
import ProfilePage from "./pages/Profile.jsx";

export default function App() {
  return (
    <Routes>
      {/* ✅ Trang mặc định khi truy cập "/" */}
      <Route path="/" element={<Navigate to="/profile" replace />} />

      {/* ✅ Trang login */}
      <Route path="/login" element={<LoginPage />} />

      {/* ✅ Trang signup */}
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />

    </Routes>
  );
}

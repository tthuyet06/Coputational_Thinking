import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function PrivateRoute() {
  const { user, loading } = useContext(AuthContext);

  // Nếu đang load profile (token) → show loading
  if (loading) return <p>Loading...</p>;

  // Nếu không login → redirect về trang login
  if (!user) return <Navigate to="/login" replace />;

  // Nếu login → render trang con
  return <Outlet />;
}

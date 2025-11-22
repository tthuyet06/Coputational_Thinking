import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import PrivateRoute from "./components/common/PrivateRoute"; // import PrivateRoute

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import Preferences from "./pages/Preferences.jsx";
import Results from "./pages/Results.jsx";
import PlaceDetail from "./pages/PlaceDetail.jsx";
import ProfilePage from "./pages/Profile.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private routes */}
        {/*<Route element={<PrivateRoute />}>*/}
          <Route path="/home" element={<Home />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/results" element={<Results />} />
          <Route path="/details/:id" element={<PlaceDetail />} />
          <Route path="/profile" element={<ProfilePage />} />
        {/*</Route>*/}
      </Routes>
    </AuthProvider>
  );
}
// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import Preferences from "./pages/Preferences.jsx";
import Results from "./pages/Results.jsx";
import PlaceDetail from "./pages/PlaceDetail.jsx";
import ProfilePage from "./pages/Profile.jsx";
import { AuthProvider, useAuthContext } from "./context/AuthContext.jsx";

// ✅ Component bảo vệ route
function PrivateRoute({ children }) {
  const { user } = useAuthContext();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ✅ Trang mặc định */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Công khai */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Các trang cần login */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />

          <Route
            path="/preferences"
            element={
              <PrivateRoute>
                <Preferences />
              </PrivateRoute>
            }
          />

          <Route
            path="/results"
            element={
              <PrivateRoute>
                <Results />
              </PrivateRoute>
            }
          />

          <Route
            path="/details/:id"
            element={
              <PrivateRoute>
                <PlaceDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

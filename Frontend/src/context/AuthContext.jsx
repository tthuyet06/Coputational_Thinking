// src/contexts/AuthContext.js

import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";
import toErrorMessage from "../utils/toErrorMessage"; // 🔥 Import hàm chuẩn hóa lỗi thống nhất

export const AuthContext = createContext();

// XÓA HÀM 'toMessage' ĐÃ BỊ LẶP LẠI LOGIC

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tự load profile nếu đã có token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      setLoading(true);
      try {
        const me = await authService.getProfile();
        // Lấy đối tượng user (cần thiết nếu BE trả {user: {...}})
        setUser(me?.user ?? me); 
      } catch (err) {
        // Token không hợp lệ/hết hạn => xóa token và thoát đăng nhập
        console.error("Auto load profile failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // LOGIN: nhận token -> gọi profile -> set user
  const login = async (username, password) => {
    setLoading(true);
    setError("");
    try {
      // authService.login trả về Promise.reject(chuỗi lỗi) khi thất bại
      const data = await authService.login(username, password);
      
      if (!data?.access_token) throw new Error("Token not found in login response");
      
      localStorage.setItem("token", data.access_token);
      
      const me = await authService.getProfile();
      setUser(me?.user ?? me);
      return true; // Thành công
    } catch (err) {
      setUser(null);
      // 🔥 Sử dụng toErrorMessage với message fallback
      setError(toErrorMessage(err, "Login failed. Please check your username and password."));
      return false; // Thất bại
    } finally {
      setLoading(false);
    }
  };

  // SIGNUP: chỉ tạo tài khoản, không set token/user
  const signup = async (username, email, password) => {
    setLoading(true);
    setError("");
    try {
      await authService.signup(username, email, password);
      return true; // Thành công
    } catch (err) {
      // 🔥 Sử dụng toErrorMessage với message fallback
      setError(toErrorMessage(err, "Signup failed. Please try again with valid data."));
      return false; // Thất bại
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError("");

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, loading, error, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};
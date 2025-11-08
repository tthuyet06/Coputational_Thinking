import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tự load profile nếu token có sẵn
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoading(true);
      try {
        const data = await authService.getProfile();
        setUser(data);
      } catch (err) {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (username, password) => {
  setLoading(true);
  setError(null);
  try {
    const tokenData = await authService.login(username, password);
    localStorage.setItem("token", tokenData.access_token);
    const userData = await authService.getProfile();
    setUser(userData);
    return true;
  } catch (err) {
    // Xử lý detail có thể là string hoặc array
    const message = err.response?.data?.detail;
    setError(
      Array.isArray(message)
        ? message.map(e => e.msg).join(", ") // nối tất cả message
        : message || "Login failed"
    );
    return false;
  } finally {
    setLoading(false);
  }
};

const signup = async (username, email, password) => {
  setLoading(true);
  setError(null);
  try {
    // 1. Gọi Register, backend chỉ trả về thông tin user (chưa có token)
      await authService.signup(email, password, username);

      // 2. Tự động Login ngay sau khi đăng ký thành công
      // (Hàm login đã được sửa ở trên để xử lý toàn bộ logic)
      const isLoggedIn = await login(username, password);
      return isLoggedIn; // Trả về true/false
  } catch (err) {
    const message = err.response?.data?.detail;
    setError(
      Array.isArray(message)
        ? message.map(e => e.msg).join(", ")
        : message || "Signup failed"
    );
    return false;
  } finally {
    setLoading(false);
  }
};



  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

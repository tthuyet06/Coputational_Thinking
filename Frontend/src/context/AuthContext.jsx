import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

const toMessage = (err, fallback) => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (typeof err?.message === "string" && err.message) return err.message;
  // Backend có thể trả mảng lỗi Pydantic
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map(d => d?.msg ?? String(d)).join(", ");
  if (typeof detail === "string") return detail;
  return fallback;
};

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
        setUser(me?.user ?? me);
      } catch (err) {
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
      const data = await authService.login(username, password);
      if (!data?.access_token) throw new Error("Token not found");
      localStorage.setItem("token", data.access_token);
      const me = await authService.getProfile();
      setUser(me?.user ?? me);
      return true;
    } catch (err) {
      setUser(null);
      setError(toMessage(err, "Login failed"));
      return false;
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
      return true;                 // thành công
    } catch (err) {
      setError(toMessage(err, "Signup failed"));
      return false;                // thất bại
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

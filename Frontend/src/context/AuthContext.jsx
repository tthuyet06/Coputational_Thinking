import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";
// Nhập hàm xử lý lỗi đã được chuẩn hóa
import toErrorMessage from "../utils/toErrorMessage"; 

export const AuthContext = createContext();

// XÓA HÀM toMessage TRÙNG LẶP (đã được thay thế bằng toErrorMessage)

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
        // Giả sử getProfile trả về { user: {...} } hoặc chỉ {...}
        setUser(me?.user ?? me); 
      } catch (err) {
        // Nếu getProfile lỗi (token hết hạn/không hợp lệ)
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
      
      // Tải thông tin người dùng
      const me = await authService.getProfile();
      setUser(me?.user ?? me);
      return true;
    } catch (err) {
      setUser(null);
      // Sử dụng toErrorMessage để hiển thị lỗi đã được chuẩn hóa
      setError(toErrorMessage(err, "Login failed"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // SIGNUP: chỉ tạo tài khoản, không set token/user
  const signup = async (username, email, password, hobbies = []) => {
    setLoading(true);
    setError("");
    try {
      // Truyền hobbies vào signup (giả định)
      await authService.signup(username, email, password, hobbies); 
      return true;                 // thành công
    } catch (err) {
      // Sử dụng toErrorMessage để hiển thị lỗi đã được chuẩn hóa
      setError(toErrorMessage(err, "Signup failed"));
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
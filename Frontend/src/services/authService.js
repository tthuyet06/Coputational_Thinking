// Thay đổi đầu file:
import api from "../api";
import toErrorMessage from "../utils/toErrorMessage"; // <--- Thêm import này

// Xóa hoàn toàn hàm const pickErrorMessage = (...) => { ... };

const authService = {
  login: async (username, password) => {
    try {
      const res = await api.post("/api/v1/auth/login", { username, password });
      return res.data;
    } catch (error) {
      // Thay pickErrorMessage bằng toErrorMessage
      return Promise.reject(toErrorMessage(error, "Login failed")); 
    }
  },

  signup: async (username, email, password, hobbies = []) => {
    try {
      const res = await api.post("/api/v1/auth/register", {
        username, email, password, hobbies,
      });
      return res.data;
    } catch (error) {
      // Thay pickErrorMessage bằng toErrorMessage
      return Promise.reject(toErrorMessage(error, "Signup failed"));
    }
  },

  getProfile: async () => {
    try {
      const res = await api.get("/api/v1/users/me");
      return res.data;
    } catch (error) {
      // Thay pickErrorMessage bằng toErrorMessage
      return Promise.reject(toErrorMessage(error, "Failed to fetch user profile"));
    }
  },
};

export default authService;
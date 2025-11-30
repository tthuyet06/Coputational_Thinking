// services/authService.js
import api from "../api"; // Axios instance

const authService = {
  // LOGIN
  login: async (username, password) => {
    try {
      const res = await api.post("/api/v1/auth/login", {
        username,
        password,
      });
      return res.data;
    } catch (error) {
      // 🔥 QUAN TRỌNG: giữ nguyên lỗi của Axios — KHÔNG tự xử lý ở đây
      throw error;
    }
  },

  // SIGNUP
  signup: async (username, email, password, hobbies = []) => {
    try {
      const res = await api.post("/api/v1/auth/register", {
        username,
        email,
        password,
        hobbies,
      });
      return res.data;
    } catch (error) {
      throw error; // <-- giữ nguyên lỗi
    }
  },

  // GET PROFILE
  getProfile: async () => {
    try {
      const res = await api.get("/api/v1/users/me");
      return res.data;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;

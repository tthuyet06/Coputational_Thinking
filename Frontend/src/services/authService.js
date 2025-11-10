import api from "../api";

// authService chỉ lo gọi API, không quản lý state React
const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post("/api/v1/auth/login", { username, password });
      return response.data; // { access_token, user }
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : detail || "Login failed";
      throw new Error(message);
    }
  },

  signup: async (email, password, username, hobbies = []) => {
    try {
      const response = await api.post("/api/v1/auth/register", {
        email,
        password,
        username,
        hobbies,
      });
      return response.data;
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : detail || "Signup failed";
      throw new Error(message);
    }
  },
};

export default authService;

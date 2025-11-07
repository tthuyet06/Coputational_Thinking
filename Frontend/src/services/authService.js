import api from "../api";

// authService chỉ lo gọi API, không quản lý state React
const authService = {
  login: async (username, password) => {
    const response = await api.post("/api/v1/auth/login", { username, password });
    return response.data; // { access_token, user }
  },

  signup: async (email, password, username, hobbies = []) => {
    // Gửi đầy đủ field backend yêu cầu
    const response = await api.post("/api/v1/auth/register", {
      email,
      password,
      username,
      hobbies,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/api/v1/auth/profile");
    return response.data;
  },
};

export default authService;

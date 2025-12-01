// src/services/userAPI.js
import api from "../api";

const userAPI = {
  async getMe() {
    const { data } = await api.get("/api/v1/users/me");
    // BE có thể trả trực tiếp user hoặc bọc trong field user
    return data?.user ?? data;
  },

  async updateMe(body) {
    // Chỉ username theo đúng UpdateUserRequest
    const { data } = await api.patch("/api/v1/users/me", body);
    return data?.user ?? data;
  },

  // Chưa có endpoint đổi password thì tạm thời không dùng hàm này
  async changePassword(body) {
    const { data } = await api.patch("/api/v1/users/password", body);
    return data;
  },
};

export default userAPI;

// src/services/userAPI.js
import api from "../api";

const userAPI = {
  async getMe() {
    const { data } = await api.get("/api/v1/users/me");
    return data?.user ?? data;
  },

  async updateMe(body) {
    const { data } = await api.patch("/api/v1/users/me", body);
    return data?.user ?? data;
  },

  async changePassword(body) {
    // BACKEND dùng PUT /me/password
    const { data } = await api.put("/api/v1/users/me/password", body);
    return data;
  },
};

export default userAPI;

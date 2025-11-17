// src/services/preferenceAPI.js
import api from "../api"; // 🔥 dùng lại axios instance hiện có

// Làm việc với hobbies (sở thích)
const preferenceAPI = {
  // Lấy list tag sở thích từ DB
  async getHobbyTags() {
    // GET /api/v1/tags/hobbies  → { tags: [...] }
    const res = await api.get("/api/v1/tags/hobbies");
    return res.data?.tags ?? [];
  },

  // Lấy hobbies hiện tại của user (nếu cần dùng ở Profile)
  async getMyHobbies() {
    // Thường là trả { user: { ..., hobbies: [...] } }
    const res = await api.get("/api/v1/users/me");
    return res.data?.user?.hobbies ?? res.data?.hobbies ?? [];
  },

  // Cập nhật hobbies cho user đang login
  async updateMyHobbies(hobbies) {
    // POST /api/v1/users/me/hobbies  body: { hobbies: [...] }
    const res = await api.post("/api/v1/users/me/hobbies", { hobbies });
    // BE trả: { message, hobbies }
    return res.data;
  },
};

export default preferenceAPI;

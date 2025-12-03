// src/services/preferenceAPI.js
import api from "../api";

/**
 * API làm việc với sở thích (hobbies) & duration tags
 */
const preferenceAPI = {
  // 🔹 Lấy danh sách hobbies (mock từ backend)
  async getHobbyTags() {
    // BE: /api/v1/tags/hobbies
    const res = await api.get("/api/v1/tags/hobbies");

    // Case 1: BE trả dạng { tags: ["#cafe", "#yen_tinh", ...] }
    if (Array.isArray(res.data?.tags)) {
      return res.data.tags.map((t, idx) => ({
        id: idx + 1,
        label: t.replace("#", "").replace(/_/g, " "),
        value: t,
        raw: t,
      }));
    }

    // Case 2: BE mock như bạn gửi: { hobbies: [ { id, name, tag, ... }, ... ] }
    if (Array.isArray(res.data?.hobbies)) {
      return res.data.hobbies.map((hobby) => ({
        id: hobby.id,
        label: hobby.name, // hiển thị tên
        value: hobby.tag,  // gửi tag cho backend
        raw: hobby,
      }));
    }

    return [];
  },

  // 🔹 Lấy hobbies hiện tại của user (list string tag: ["#cafe", ...])
  async getMyHobbies() {
    const res = await api.get("/api/v1/users/me");
    if (Array.isArray(res.data?.hobbies)) return res.data.hobbies;
    if (Array.isArray(res.data?.user?.hobbies)) return res.data.user.hobbies;
    return [];
  },

  // 🔹 Cập nhật hobbies của user
  async updateMyHobbies(hobbies) {
    const res = await api.post("/api/v1/users/me/hobbies", { hobbies });
    return res.data; // { message, hobbies }
  },

  // 🔹 Lấy duration tags cho trang Home
  async getDurationTags() {
    // BE: { duration_tags: [ { display_name, tag_id }, ... ] }
    const res = await api.get("/api/v1/tags/durations");
    return res.data?.duration_tags ?? [];
  },
};

export default preferenceAPI;

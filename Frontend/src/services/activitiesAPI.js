// src/services/preferenceAPI.js
import api from "../api";

/**
 * API làm việc với hoạt động (activities)) & duration tags
 */
const activitiesAPI = {
  // 🔹 Lấy danh sách activities (mock từ backend)
  async getActivityTags() {
    // BE: /api/v1/tags/activities
    const res = await api.get("/api/v1/tags/activities");

    // Case 1: BE trả dạng { tags: ["#dichoi", "#anuong", ...] }
    if (Array.isArray(res.data?.tags)) {
      return res.data.tags.map((t, idx) => ({
        id: idx + 1,
        label: t.replace("#", "").replace(/_/g, " "),
        value: t,
        raw: t,
      }));
    }

    // Case 2: BE mock như bạn gửi: { activities: [ { id, name, tag, ... }, ... ] }
    if (Array.isArray(res.data?.activities)) {
      return res.data.activities.map((activity) => ({
        id: activity.id,
        label: activity.name, // hiển thị tên
        value: activity.code,  // gửi tag cho backend
        raw: activity,
      }));
    }

    return [];
  },

  // 🔹 Lấy activities hiện tại của user (list string tag: ["#cafe", ...])
  async getMyActivities() {
    const res = await api.get("/api/v1/users/me");
    if (Array.isArray(res.data?.activities)) return res.data.activities;
    if (Array.isArray(res.data?.user?.activities)) return res.data.user.activities;
    return [];
  },

  // 🔹 Cập nhật hobbies của user
  async updateMyActivities(activities) {
    const res = await api.post("/api/v1/users/me/activities", { activities });
    return res.data; // { message, hobbies }
  },

  // 🔹 Lấy duration tags cho trang Home
  async getDurationTags() {
    // BE: { duration_tags: [ { display_name, tag_id }, ... ] }
    const res = await api.get("/api/v1/tags/durations");
    return res.data?.duration_tags ?? [];
  },
};

export default activitiesAPI;

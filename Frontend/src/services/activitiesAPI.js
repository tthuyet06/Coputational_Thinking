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
};

export default activitiesAPI;

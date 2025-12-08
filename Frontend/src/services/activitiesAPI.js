// src/services/activitiesAPI.js
import api from "../api";

/**
 * API làm việc với hoạt động (activities)
 */
const activitiesAPI = {
  async getActivityTags() {
    const res = await api.get("/api/v1/tags/activities");

    if (Array.isArray(res.data?.activities)) {
      return res.data.activities.map((activity) => ({
        id: activity.id,
        label: activity.name,   // hiển thị
        value: activity.tag,    // gửi BE: "#work_cafe"
        raw: activity,
      }));
    }

    return [];
  },
};

export default activitiesAPI;

// src/services/suggestionAPI.js
import api from "../api";

const suggestionAPI = {
  async getRecommendations({ latitude, longitude, duration_tag }) {
    // Lấy activities user đã chọn từ localStorage
    let activities = [];
    try {
      const stored = localStorage.getItem("activities");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          activities = parsed;           // ['#cafe', '#mall']
        } else if (typeof parsed === "string" && parsed.trim() !== "") {
          activities = [parsed];         // '#mall' -> ['#mall']
        }
      }
    } catch (e) {
      console.error("Parse activities error", e);
    }

    const res = await api.post("/api/v1/recommend/", {
      latitude,
      longitude,
      duration_tag,
      activity: activities, // 👈 GỬI LIST LÊN BE
    });

    return res.data?.recommendations ?? [];
  },
};

export default suggestionAPI;

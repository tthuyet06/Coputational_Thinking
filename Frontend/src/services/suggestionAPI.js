// src/services/suggestionAPI.js
import api from "../api"; // 🔥 dùng lại axios instance hiện có

const suggestionAPI = {
  // Gọi API recommend theo schema backend
  // payload: { latitude, longitude, duration_tag }
  async getRecommendations({ latitude, longitude, duration_tag }) {
    const res = await api.post("/api/v1/recommend/", {
      latitude,
      longitude,
      duration_tag,
    });
    // BE trả: { recommendations: [...] }
    return res.data;
  },
};

export default suggestionAPI;

// src/services/suggestionAPI.js
import api from "../api";

/**
 * API gọi recommend backend
 */
const suggestionAPI = {
  async getRecommendations({ latitude, longitude, duration_tag }) {
    const res = await api.post("/api/v1/recommend/recommend", {
      latitude,
      longitude,
      duration_tag,
    });

    // BE: { recommendations: [ { id, name, address, image_url, description, tags }, ... ] }
    return res.data?.recommendations ?? [];
  },
};

export default suggestionAPI;

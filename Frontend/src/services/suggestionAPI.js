// src/services/suggestionAPI.js
import api from "../api";

/**
 * API gọi recommend backend
 */
const suggestionAPI = {
  async getRecommendations({ latitude, longitude, duration_tag, activity }) {
    const res = await api.post("/api/v1/recommend/", {
      latitude,
      longitude,
      duration_tag,
      activity,
    });

    // BE: { recommendations: [ { id, name, address, image_url, description, tags }, ... ] }
    return res.data?.recommendations ?? [];
  },
};

export default suggestionAPI;

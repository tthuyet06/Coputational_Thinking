// src/services/suggestionAPI.js
import api from "../api";

const suggestionAPI = {
  // 1. Thêm 'activity' vào tham số nhận vào
  async getRecommendations({ latitude, longitude, duration_tag, activity }) {
    // 2. Validate dữ liệu để khớp Schema

    // Schema yêu cầu: "duration_tag": "string"
    // Nếu duration_tag là số (VD: 1), hãy ép sang string
    const finalDurationTag = String(duration_tag); 

    // Schema yêu cầu: "activity": ["string"]
    // Đảm bảo activity là mảng
    const finalActivity = Array.isArray(activity) ? activity : [];

    // Gửi request
    const res = await api.post("/api/v1/recommend", {
      latitude: latitude,      // Schema: number -> OK
      longitude: longitude,    // Schema: number -> OK
      duration_tag: finalDurationTag, // Schema: string -> Đã ép kiểu
      activity: finalActivity, // Schema: [string] -> OK (Lấy từ tham số truyền vào)
    });
    return res.data?.recommendations ?? [];
  },
};

export default suggestionAPI;

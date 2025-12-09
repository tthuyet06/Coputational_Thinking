// src/services/suggestionAPI.js
import api from "../api";

const suggestionAPI = {
  /**
   * Lấy gợi ý dựa trên vị trí, thời gian, sở thích và hoạt động
   * Schema yêu cầu:
   * - latitude: number
   * - longitude: number
   * - duration_tag: string
   * - hobby: [string]
   * - activity: [string]
   */
  async getRecommendations({ latitude, longitude, duration_tag, activity, hobby }) {
    
    // 1. Chuẩn hóa dữ liệu (Data Normalization)
    const payload = {
      // Ép kiểu về Number (đề phòng trường hợp input là string)
      latitude: Number(latitude),
      longitude: Number(longitude),

      // Ép kiểu về String
      duration_tag: String(duration_tag),

      // Đảm bảo là Array, nếu không có thì gửi mảng rỗng
      hobby: Array.isArray(hobby) ? hobby : [],
      activity: Array.isArray(activity) ? activity : [],
    };

    // (Optional) Log ra để kiểm tra trước khi gửi
    // console.log("Payload sent to recommend:", payload);

    // 2. Gửi request
    try {
      const res = await api.post("/api/v1/recommend/", payload);
      
      // Trả về mảng recommendations, nếu không có thì trả về mảng rỗng
      return res.data?.recommendations ?? [];
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      return []; // Trả về mảng rỗng khi lỗi để không crash UI
    }
  },
};

export default suggestionAPI;

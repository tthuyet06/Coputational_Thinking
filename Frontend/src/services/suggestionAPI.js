// src/services/suggestionAPI.js
import api from "../api"; // Import axios instance đã cấu hình

/**
 * Gọi API Backend để lấy danh sách gợi ý.
 * @param {object} params - Tham số request body.
 * @param {number} params.latitude - Vĩ độ.
 * @param {number} params.longitude - Kinh độ.
 * @param {string} params.duration_tag - Tag thời lượng.
 * @returns {Promise<object>} - Dữ liệu trả về từ Backend.
 */
const suggestionAPI = {
  getRecommendations: async (params) => {
    try {
      // API endpoint: ví dụ /api/v1/recommendations
      const res = await api.post("/api/v1/recommendations", params);
      return res.data; // Chứa { recommendations: [...] }
    } catch (error) {
      // Bỏ qua logic pickErrorMessage phức tạp (để đơn giản),
      // chỉ cần throw để component Results bắt và xử lý.
      throw error;
    }
  },
};

export default suggestionAPI;
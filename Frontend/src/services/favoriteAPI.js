// services/favoriteAPI.js
import axiosClient from "../api"; // Đảm bảo đường dẫn import đúng với cấu trúc dự án của bạn

const favoriteAPI = {
  /**
   * Lấy danh sách địa điểm yêu thích của user hiện tại.
   * Response schema: [{ id, name, address, image, overview, tags: [] }]
   */
  getMyFavorites: () => {
    return axiosClient.get("api/v1/favorites"); // Thay đổi endpoint cho phù hợp với backend của bạn
  },

  /**
   * Toggle favorite (Like/Unlike) một địa điểm.
   * @param {number} placeId ID của địa điểm
   */
  toggleFavorite: (placeId) => {
    // Giả sử backend dùng POST để toggle hoặc DELETE để xóa
    return axiosClient.post(`/favorites/${placeId}/toggle`);
  }
};

export default favoriteAPI;
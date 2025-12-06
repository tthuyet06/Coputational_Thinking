// services/favoriteAPI.js
import axiosClient from "../api"; // Đảm bảo đường dẫn import đúng

const favoriteAPI = {
  getMyFavorites: () => {
    return axiosClient.get("/api/v1/favorites/");
  },

  addFavorite: (placeId) => {
    return axiosClient.post(`/api/v1/favorites/${placeId}`);
  },

  removeFavorite: (placeId) => {
    return axiosClient.delete(`/api/v1/favorites/${placeId}`);
  },

  updateFavoriteStatus: (placeId, isFavorite) => {
    if (isFavorite) {
      // Nếu UI chốt là "Thích" -> Gọi API POST
      return favoriteAPI.addFavorite(placeId);
    } else {
      // Nếu UI chốt là "Không thích" -> Gọi API DELETE
      return favoriteAPI.removeFavorite(placeId);
    }
  }
};

export default favoriteAPI;
// src/services/activityAPI.js
import api from "../api";

/**
 * Lấy list activities trong DB.
 * Dùng cho trang /activities để render.
 */
const activityAPI = {
  getActivities: async () => {
    // Nếu trong docs bạn thấy path là /api/v1/tags/activities
    // thì ở đây chỉ cần "/tags/activities" (vì baseURL đã là /api/v1)
    const res = await api.get("/tags/activities");

    // Tùy backend trả về:
    // - { activities: [...] }
    // - hoặc đơn giản là [ ... ]
    const list = res.data.activities ?? res.data;

    // Chuẩn hóa về dạng FE dễ dùng
    return list.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      // thêm hai field để dùng với UI giống TagSelector nếu muốn
      label: a.name,
      value: a.code,
    }));
  },

  /**
   * (Nếu backend có) Lấy activities hiện tại của user.
   * Ví dụ backend trả ["#eating_out", "#cafe"].
   */
  getMyActivities: async () => {
    const res = await api.get("/users/me/activities");
    return res.data.activities ?? res.data;
  },

  /**
   * (Nếu backend có) Cập nhật activities cho user.
   * activities: array code/tag, ví dụ ["#eating_out", "#cafe"]
   */
  updateMyActivities: async (activities) => {
    await api.post("/users/me/activities", { activities });
  },
};

export default activityAPI;

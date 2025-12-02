// src/services/preferenceAPI.js
import api from "../api"; // Giả sử axios instance của bạn tên là api

const activitiesAPI = {
  // 🔹 Lấy danh sách activities
  async getActivityTags() {
    try {
      const res = await api.get("/api/v1/tags/activities");
      
      // Lưu ý: Kiểm tra kỹ xem axios của bạn có interceptor tự lấy .data chưa.
      // Dòng này đảm bảo lấy được data dù có interceptor hay không.
      const data = res.data ? res.data : res; 

      // Case 1: BE trả về mảng string đơn giản ["#cafe", "#food"]
      // Schema: { tags: [...] }
      if (data?.tags && Array.isArray(data.tags)) {
        return data.tags.map((t, idx) => ({
          id: idx + 1,
          label: typeof t === 'string' ? t.replace("#", "").replace(/_/g, " ") : String(t),
          value: t, // Giá trị gốc để gửi lại BE
        }));
      }

      // Case 2: BE trả về mảng object chi tiết
      // Schema: { activities: [ { id, name, code }, ... ] }
      if (data?.activities && Array.isArray(data.activities)) {
        return data.activities.map((activity) => ({
          id: activity.id,
          label: activity.name || activity.display_name || "Unknown", // Fallback nếu không có name
          value: activity.code || activity.tag || activity.id,        // Ưu tiên code, fallback về id
          raw: activity,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching activity tags:", error);
      return [];
    }
  },

  // 🔹 Lấy activities của user (List string)
  async getMyActivities() {
    try {
      const res = await api.get("/api/v1/users/me");
      const data = res.data ? res.data : res;

      // Trả về mảng string ["#cafe", "#tea"]
      if (Array.isArray(data?.activities)) return data.activities;
      if (data?.user && Array.isArray(data.user.activities)) return data.user.activities;
      
      return [];
    } catch (error) {
      return [];
    }
  },

  // 🔹 Cập nhật activities
  async updateMyActivities(activities) {
    // activities là mảng string hoặc mảng object {value} tùy logic component
    // Nếu component gửi mảng object lên, cần map về string trước khi gửi
    const payload = activities.map(item => (typeof item === 'object' ? item.value : item));
    
    const res = await api.post("/api/v1/users/me/activities", { activities: payload });
    return res.data || res;
  },

  // 🔹 Lấy duration tags (CẦN SỬA NHIỀU NHẤT)
  // Ví dụ với hàm getDurationTags (hoặc getActivityTags tương tự)
  async getDurationTags() {
    try {
      const res = await api.get("/api/v1/tags/durations");
      const data = res.data ? res.data : res;
      const rawList = data?.duration_tags || [];

      // Ví dụ trong hàm getDurationTags hoặc getActivityTags
  return rawList.map((item) => ({
    id: item.tag_id || item.id,
    
    // 👇 SỬA DÒNG NÀY: In toàn bộ object ra để nhìn
    label: item.display_name || item.name || JSON.stringify(item), 
    
    value: item.tag_id || item.id,
  }));s
    } catch (error) {
      console.error(error);
      return [];
    }
  },
};

export default activitiesAPI;
import api from "../api";

export default {
  async getMe() {
    const { data } = await api.get("/api/v1/users/me");
    return data?.user ?? data; // tuỳ backend
  },
  async updateMe(body) {
    const { data } = await api.patch("/api/v1/users/me", body);
    return data?.user ?? data;
  },
  async changePassword(body) {
    const { data } = await api.patch("/api/v1/users/password", body);
    return data;
  },
};

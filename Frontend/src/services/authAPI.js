import { api } from "./apiClient";
import toErrorMessage from "../utils/toErrorMessage";

export const authAPI = {
  async register(username, email, password) {
    try {
      const { data } = await api.post("/auth/register", { username, email, password });
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: toErrorMessage(e) }; // <-- luôn là string
    }
  },

  async login(username, password) {
    try {
      const { data } = await api.post("/auth/login", { username, password });
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: toErrorMessage(e) };
    }
  },

  async me() {
    return api.get("/users/me");
  },
};

// Thay đổi đầu file:
import api from "../api";
import toErrorMessage from "../utils/toErrorMessage"; // <--- Thêm import này

// Xóa hoàn toàn hàm const pickErrorMessage = (...) => { ... };

const pickErrorMessage = (error, fallback) => {
  if (!error?.response) return error?.message || "Network error";
  const { data, statusText } = error.response;

  // 1) Chuỗi thẳng
  if (typeof data === "string") return data;

  // 2) FastAPI: detail = string / array / object
  const detail = data?.detail;

  // string
  if (typeof detail === "string") return detail;

  // array: [{msg,...}] hoặc ["..."]
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map(it => (typeof it === "string" ? it : it?.msg || String(it)))
      .join("; ");
  }

  // object: { field: ["msg1", "msg2"] } hoặc { field: "msg" }
  if (detail && typeof detail === "object") {
    const msgs = [];
    for (const v of Object.values(detail)) {
      if (Array.isArray(v)) msgs.push(...v.map(x => (typeof x === "string" ? x : String(x))));
      else if (typeof v === "string") msgs.push(v);
      else if (v && typeof v === "object") msgs.push(JSON.stringify(v));
    }
    if (msgs.length) return msgs.join("; ");
  }

  // 3) Các key phổ biến khác
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (Array.isArray(data?.errors)) {
    return data.errors.map(e => e?.msg || e?.message || String(e)).join("; ");
  }

  // 4) Fallback
  try {
    const body = JSON.stringify(data);
    if (body && body !== "{}") return body;
  } catch {}
  return statusText || fallback;
};

const authService = {
  login: async (username, password) => {
    try {
      const res = await api.post("/api/v1/auth/login", { username, password });
      return res.data;
    } catch (error) {
      return Promise.reject(pickErrorMessage(error, "Login failed"));
    }
  },

  signup: async (username, email, password, hobbies = []) => {
    try {
      const res = await api.post("/api/v1/auth/register", {
        username, email, password, hobbies,
      });
      return res.data;
    } catch (error) {
      return Promise.reject(pickErrorMessage(error, "Signup failed"));
    }
  },

  getProfile: async () => {
    try {
      const res = await api.get("/api/v1/users/me");
      return res.data;
    } catch (error) {
      return Promise.reject(pickErrorMessage(error, "Failed to fetch user profile"));
    }
  },
};

export default authService;
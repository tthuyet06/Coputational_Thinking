// src/api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8888/api/v1", // 👈 thay bằng URL backend FastAPI của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Thêm interceptor để tự động gắn token (nếu có)
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;

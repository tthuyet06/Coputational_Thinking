// src/api.js
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || window.location.origin;
// Dev: dùng env trỏ về http://127.0.0.1:8000
// Khi deploy + ngrok: KHÔNG set env, nó sẽ dùng chính origin (link ngrok)

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

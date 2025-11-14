import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("accessToken");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (!refreshing) {
        const refreshToken = localStorage.getItem("refreshToken");
        refreshing = api
          .post("/auth/refresh", { refresh_token: refreshToken })
          .then(({ data }) => {
            const access = data?.access_token;
            if (access) {
              localStorage.setItem("accessToken", access);
              api.defaults.headers.common.Authorization = `Bearer ${access}`;
            }
            return access;
          })
          .catch(() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            return null;
          })
          .finally(() => (refreshing = null));
      }

      const newAccess = await refreshing;
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
    }
    return Promise.reject(err);
  }
);

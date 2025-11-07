import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => axiosClient.post("/auth/login", data),
  signup: (data) => axiosClient.post("/auth/signup", data),
  logout: () => axiosClient.post("/auth/logout"),
};

export default authApi;

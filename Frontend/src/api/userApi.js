import axiosClient from "./axiosClient";

const userApi = {
  getProfile: () => axiosClient.get("/users/me"),
  updateProfile: (data) => axiosClient.put("/users/me", data),
};

export default userApi;

import axiosClient from "../api/axios";

export const authService = {
  register: (payload) => axiosClient.post("/auth/register", payload),

  login: (payload) => axiosClient.post("/auth/login", payload),

  refreshToken: (refreshToken) =>
    axiosClient.post("/auth/refresh-token", { refreshToken }),

  logout: (refreshToken) =>
    axiosClient.post("/auth/logout", { refreshToken }),

  logoutAll: () => axiosClient.post("/auth/logout-all"),

  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  verifyOTP: (email, otp) =>
    axiosClient.post("/auth/verify-otp", { email, otp }),

  resetPassword: (email, newPassword) =>
    axiosClient.post("/auth/reset-password", { email, newPassword }),

  me: () => axiosClient.get("/auth/me"),

  updateProfile: (payload) => axiosClient.put("/auth/profile", payload),

  changePassword: (payload) =>
    axiosClient.put("/auth/change-password", payload),
};

export default authService;

import axiosClient from "../api/axios";

export function formatNotificationTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

export const notificationService = {
  getNotifications: async (params = {}) => {
    const res = await axiosClient.get("/notifications", { params });
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      unread_count: res.data?.unread_count ?? 0,
      pagination: res.data?.pagination || null,
    };
  },

  getUnreadCount: async () => {
    const res = await axiosClient.get("/notifications/unread-count");
    return res.data?.data?.unread_count ?? 0;
  },

  markRead: (id) => axiosClient.patch(`/notifications/${id}/read`),

  markAllRead: () => axiosClient.patch("/notifications/read-all"),

  create: (payload) => axiosClient.post("/notifications", payload),
};

export default notificationService;

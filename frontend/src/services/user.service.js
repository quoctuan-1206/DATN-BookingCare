import axiosClient from "../api/axios";
import { resolveMediaUrl } from "../utils/media";

const DEFAULT_AVATAR = "https://i.pravatar.cc/150";

export function mapUserFromApi(user) {
  if (!user) return null;

  const role = user.role || "Patient";

  return {
    ...user,
    name: user.full_name || `${user.last_name || ""} ${user.first_name || ""}`.trim(),
    avatar: resolveMediaUrl(user.avatar) || `${DEFAULT_AVATAR}?u=${user.id}`,
    role,
    status: user.is_active !== false ? "active" : "inactive",
  };
}

export const userService = {
  getUsers: async (params = {}) => {
    const res = await axiosClient.get("/users", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: list.map(mapUserFromApi),
      pagination: payload.pagination || {
        total: list.length,
        page: 1,
        limit: list.length,
        total_pages: 1,
      },
    };
  },

  getUserById: async (id) => {
    const res = await axiosClient.get(`/users/${id}`);
    return mapUserFromApi(res.data?.data);
  },

  updateUserStatus: (id, isActive) =>
    axiosClient.patch(`/users/${id}/status`, { is_active: isActive }),
};

export default userService;

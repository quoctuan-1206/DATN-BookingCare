import axiosClient from "../api/axios";
import { resolveMediaUrl } from "../utils/media";

const DEFAULT_IMAGE = "https://picsum.photos/600/400?clinic";

export function mapClinicFromApi(clinic) {
  if (!clinic) return null;

  const image = resolveMediaUrl(clinic.image) || DEFAULT_IMAGE;

  return {
    ...clinic,
    image,
    address_full: clinic.address_full || clinic.address,
    doctor_count: clinic.doctor_count ?? 0,
    mapQuery:
      clinic.mapQuery ||
      encodeURIComponent(clinic.name || clinic.address || ""),
    images: clinic.images || [
      image,
      `https://picsum.photos/400/300?c${clinic.id}a`,
      `https://picsum.photos/400/300?c${clinic.id}b`,
    ],
  };
}

export const clinicService = {
  getClinics: async (params = {}) => {
    const res = await axiosClient.get("/clinics", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: list.map(mapClinicFromApi),
      pagination: payload.pagination || {
        total: list.length,
        page: 1,
        limit: list.length,
        total_pages: 1,
      },
    };
  },

  getClinicById: async (id) => {
    const res = await axiosClient.get(`/clinics/${id}`);
    return mapClinicFromApi(res.data?.data);
  },

  createClinic: (payload) => axiosClient.post("/clinics", payload),

  updateClinic: (id, payload) => axiosClient.put(`/clinics/${id}`, payload),

  deleteClinic: (id) => axiosClient.delete(`/clinics/${id}`),
};

export default clinicService;

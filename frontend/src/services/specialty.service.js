import axiosClient from "../api/axios";
import { resolveMediaUrl } from "../utils/media";

const DEFAULT_IMAGE = "https://picsum.photos/600/400?specialty";

export function mapSpecialtyFromApi(specialty) {
  if (!specialty) return null;

  return {
    ...specialty,
    image: resolveMediaUrl(specialty.image) || DEFAULT_IMAGE,
    doctor_count: specialty.doctor_count ?? 0,
    clinic_count: specialty.clinic_count ?? 0,
    clinics: specialty.clinics || [],
  };
}

export const specialtyService = {
  getSpecialties: async (params = {}) => {
    const res = await axiosClient.get("/specialties", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: list.map(mapSpecialtyFromApi),
      pagination: payload.pagination || {
        total: list.length,
        page: 1,
        limit: list.length,
        total_pages: 1,
      },
    };
  },

  getSpecialtyById: async (id) => {
    const res = await axiosClient.get(`/specialties/${id}`);
    return mapSpecialtyFromApi(res.data?.data);
  },

  createSpecialty: (payload) => axiosClient.post("/specialties", payload),

  updateSpecialty: (id, payload) =>
    axiosClient.put(`/specialties/${id}`, payload),

  deleteSpecialty: (id) => axiosClient.delete(`/specialties/${id}`),
};

export default specialtyService;

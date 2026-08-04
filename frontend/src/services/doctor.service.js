import axiosClient from "../api/axios";

const DEFAULT_AVATAR = "https://picsum.photos/300/300?doctor";

/**
 * Chuẩn hóa doctor từ API về shape UI đang dùng
 */
export function mapDoctorFromApi(doctor) {
  if (!doctor) return null;

  return {
    ...doctor,
    image: doctor.avatar || doctor.image || DEFAULT_AVATAR,
    avatar: doctor.avatar || doctor.image || DEFAULT_AVATAR,
    specialty: doctor.specialty || "—",
    clinic: doctor.clinic || "—",
    hospital: doctor.clinic || "—",
    rating: doctor.rating ?? 0,
    consultation_fee: Number(doctor.consultation_fee || 0),
    reviews: doctor.reviews || [],
  };
}

export const doctorService = {
  getDoctors: async (params = {}) => {
    const res = await axiosClient.get("/doctors", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];

    return {
      ...payload,
      data: list.map(mapDoctorFromApi),
      pagination: payload.pagination || {
        total: list.length,
        page: 1,
        limit: list.length,
        total_pages: 1,
      },
    };
  },

  getDoctorById: async (id) => {
    const res = await axiosClient.get(`/doctors/${id}`);
    return mapDoctorFromApi(res.data?.data);
  },

  createDoctor: (payload) => axiosClient.post("/doctors", payload),

  updateDoctor: (id, payload) => axiosClient.put(`/doctors/${id}`, payload),

  deleteDoctor: (id) => axiosClient.delete(`/doctors/${id}`),
};

export default doctorService;

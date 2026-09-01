import axiosClient from "../api/axios";

export function mapMedicine(medicine) {
  if (!medicine) return null;
  return {
    ...medicine,
    price: medicine.price != null ? Number(medicine.price) : 0,
  };
}

export const medicineService = {
  getMedicines: async (params = {}) => {
    const res = await axiosClient.get("/medicines", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];
    return {
      ...payload,
      data: list.map(mapMedicine),
      pagination: payload.pagination,
    };
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/medicines/${id}`);
    return mapMedicine(res.data?.data);
  },

  create: (payload) => axiosClient.post("/medicines", payload),

  update: (id, payload) => axiosClient.put(`/medicines/${id}`, payload),

  delete: (id) => axiosClient.delete(`/medicines/${id}`),
};

export default medicineService;

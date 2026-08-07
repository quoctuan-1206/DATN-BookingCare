import axiosClient from "../api/axios";

export function mapMedicalRecord(record) {
  if (!record) return null;
  return {
    ...record,
    diagnosis: record.diagnosis || "—",
    symptoms: record.symptoms || "—",
    conclusion: record.conclusion || "—",
    note: record.note || "",
    has_prescription: Boolean(record.has_prescription),
  };
}

export const medicalRecordService = {
  getRecords: async (params = {}) => {
    const res = await axiosClient.get("/medical-records", { params });
    const payload = res.data || {};
    const list = Array.isArray(payload.data) ? payload.data : [];
    return {
      ...payload,
      data: list.map(mapMedicalRecord),
      pagination: payload.pagination,
    };
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/medical-records/${id}`);
    return mapMedicalRecord(res.data?.data);
  },

  getByAppointmentId: async (appointmentId) => {
    const res = await axiosClient.get(
      `/medical-records/by-appointment/${appointmentId}`,
    );
    return mapMedicalRecord(res.data?.data);
  },

  create: (payload) => axiosClient.post("/medical-records", payload),

  update: (id, payload) => axiosClient.put(`/medical-records/${id}`, payload),
};

export default medicalRecordService;

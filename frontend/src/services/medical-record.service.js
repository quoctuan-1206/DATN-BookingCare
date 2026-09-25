import axiosClient from "../api/axios";

export function mapMedicalRecord(record) {
  if (!record) return null;
  return {
    ...record,
    diagnosis: record.diagnosis || "—",
    symptoms: record.symptoms || "—",
    blood_pressure: record.blood_pressure || "",
    heart_rate: record.heart_rate ?? "",
    temperature: record.temperature ?? "",
    spo2: record.spo2 ?? "",
    respiratory_rate: record.respiratory_rate ?? "",
    weight: record.weight ?? record.patient_weight ?? "",
    height: record.height ?? record.patient_height ?? "",
    clinical_examination: record.clinical_examination || "",
    icd10_code: record.icd10_code || "",
    secondary_diagnosis: record.secondary_diagnosis || "",
    assessment: record.assessment || record.conclusion || "",
    follow_up_date: record.follow_up_date || "",
    follow_up_date_display: record.follow_up_date_display || "",
    conclusion: record.conclusion || "—",
    note: record.note || "",
    has_prescription: Boolean(record.has_prescription),
    prescription: record.prescription || null,
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

  create: async (payload) => {
    const res = await axiosClient.post("/medical-records", payload);
    return mapMedicalRecord(res.data?.data);
  },

  update: async (id, payload) => {
    const res = await axiosClient.put(`/medical-records/${id}`, payload);
    return mapMedicalRecord(res.data?.data);
  },
};

export default medicalRecordService;

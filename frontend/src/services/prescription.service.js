import axiosClient from "../api/axios";

export function mapPrescription(prescription) {
  if (!prescription) return null;
  return {
    ...prescription,
    items: Array.isArray(prescription.items) ? prescription.items : [],
    total_amount: Number(prescription.total_amount || 0),
  };
}

export const prescriptionService = {
  getById: async (id) => {
    const res = await axiosClient.get(`/prescriptions/${id}`);
    return mapPrescription(res.data?.data);
  },

  getByMedicalRecordId: async (medicalRecordId) => {
    const res = await axiosClient.get(
      `/prescriptions/by-medical-record/${medicalRecordId}`,
    );
    return mapPrescription(res.data?.data);
  },

  create: (payload) => axiosClient.post("/prescriptions", payload),

  update: (id, payload) => axiosClient.put(`/prescriptions/${id}`, payload),
};

export default prescriptionService;
